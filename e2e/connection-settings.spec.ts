import type { ElectronApplication, Page } from "@playwright/test";

import { certPaths } from "./certs";
import { test, expect, launchApp, openMainWindow, quitApp, runFixme } from "./fixtures";
import {
  createConnection,
  expandAdvancedSettings,
  expectListenerAcceptsConnection,
  findFreePort,
  gotoEditForm,
  gotoRoute,
  routeOf,
  startEchoServer,
} from "./helpers";

// The connection form's settings beyond name and destination: advanced
// settings, client certificates, autostart and the unsaved changes prompt.
// Each one is saved through the real CLI and read back in the edit form.

const certFile = certPaths().clientCert;
const keyFile = certPaths().clientKey;

// Linux has no OS certificate store integration, so the form shows the manual
// client certificate fields directly instead of in an accordion.
const hasCertStore = process.platform === "darwin" || process.platform === "win32";

const openManualCertSection = async (page: Page) => {
  if (hasCertStore) {
    await page.getByText("Set client certificate manually", { exact: true }).click();
  }
  await expect(page.getByText("Client Certificate Text", { exact: true })).toBeVisible();
};

const saveAndWaitForView = async (page: Page) => {
  await page.getByRole("button", { name: "Save" }).click();
  await page.waitForFunction(() => /^#\/view_connection\/.+/.test(window.location.hash));
  return (await routeOf(page)).replace("#/view_connection/", "");
};

test("Pomerium URL and Disable TLS Verification persist through save and edit", async ({
  page,
}) => {
  const id = await createConnection(page, { name: "E2E Advanced", destination: "db.example:5432" });

  await gotoEditForm(page, id);
  await expandAdvancedSettings(page);
  const tls = page.getByRole("switch", { name: "Disable TLS Verification" });
  await expect(tls).not.toBeChecked();
  await page.getByLabel("Pomerium URL").fill("https://bastion.example.com");
  await tls.check();
  await saveAndWaitForView(page);

  await gotoEditForm(page, id);
  await expandAdvancedSettings(page);
  await expect(page.getByLabel("Pomerium URL")).toHaveValue("https://bastion.example.com");
  await expect(page.getByRole("switch", { name: "Disable TLS Verification" })).toBeChecked();

  // And they can be turned back off.
  await page.getByLabel("Pomerium URL").fill("");
  await page.getByRole("switch", { name: "Disable TLS Verification" }).uncheck();
  await saveAndWaitForView(page);
  await gotoEditForm(page, id);
  await expandAdvancedSettings(page);
  await expect(page.getByLabel("Pomerium URL")).toHaveValue("");
  await expect(page.getByRole("switch", { name: "Disable TLS Verification" })).not.toBeChecked();
});

test("the protocol choice is saved", async ({ page }) => {
  await gotoRoute(page, "#/connectForm");
  await page.getByLabel("Name").fill("E2E UDP");
  await page.getByLabel("Destination").fill("dns.example:53");
  const protocol = page.getByRole("combobox", { name: "Protocol" });
  await expect(protocol).toHaveText("TCP");
  await protocol.click();
  await page.getByRole("option", { name: "UDP" }).click();
  const id = await saveAndWaitForView(page);

  await gotoEditForm(page, id);
  await expect(page.getByRole("combobox", { name: "Protocol" })).toHaveText("UDP");
});

test("the protocol select shows the protocol just picked", async ({ page }) => {
  // The change handler mutates the connection state in place, so React doesn't
  // re-render and the select keeps showing the old value (#636).
  test.fixme(!runFixme, "https://github.com/pomerium/desktop-client/issues/636");
  await gotoRoute(page, "#/connectForm");
  const protocol = page.getByRole("combobox", { name: "Protocol" });
  await protocol.click();
  await page.getByRole("option", { name: "UDP" }).click();
  await expect(protocol).toHaveText("UDP");
});

test("client certificate from files is saved and shown on edit", async ({ page }) => {
  await gotoRoute(page, "#/connectForm");
  await page.getByLabel("Name").fill("E2E Client Cert");
  await page.getByLabel("Destination").fill("db.example:5432");
  await expandAdvancedSettings(page);
  await openManualCertSection(page);

  await page.locator("#cert-file").setInputFiles(certFile);
  await expect(page.getByPlaceholder("e.g. copy/paste the cert in PEM format")).toHaveValue(
    /BEGIN CERTIFICATE/,
  );
  // The key is required once a certificate is set.
  await expect(page.getByRole("button", { name: "Save" })).toBeDisabled();
  await page.locator("#key-file").setInputFiles(keyFile);
  await expect(page.getByPlaceholder("e.g. copy/paste the key in PEM format")).toHaveValue(
    /BEGIN PRIVATE KEY/,
  );
  const id = await saveAndWaitForView(page);

  // Once saved, the CLI parses the certificate and the form shows its details
  // instead of the text fields.
  await gotoEditForm(page, id);
  await expandAdvancedSettings(page);
  if (hasCertStore) {
    await page.getByText("Set client certificate manually", { exact: true }).click();
  }
  await expect(page.getByText("Client Certificate", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Details" }).click();
  const details = page.getByRole("dialog");
  await expect(details.getByText("Cert Details", { exact: true })).toBeVisible();
  // Self-signed, so the organization shows as both issuer and subject.
  await expect(details.getByText("Pomerium E2E", { exact: true }).first()).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(details).toHaveCount(0);

  // Deleting it brings the text fields back, and saving clears it.
  await page.getByRole("button", { name: "delete" }).click();
  await expect(page.getByText("Client Certificate Text", { exact: true })).toBeVisible();
  await saveAndWaitForView(page);
  await gotoEditForm(page, id);
  await expandAdvancedSettings(page);
  await openManualCertSection(page);
  await expect(page.getByPlaceholder("e.g. copy/paste the cert in PEM format")).toHaveValue("");
});

test("client certificate pasted as text can be saved", async ({ page }) => {
  // Typing in the key text area overwrites the certificate (#633).
  test.fixme(!runFixme, "https://github.com/pomerium/desktop-client/issues/633");
  const fs = await import("node:fs/promises");
  const [certText, keyText] = await Promise.all([
    fs.readFile(certFile, "utf8"),
    fs.readFile(keyFile, "utf8"),
  ]);

  await gotoRoute(page, "#/connectForm");
  await page.getByLabel("Name").fill("E2E Pasted Cert");
  await page.getByLabel("Destination").fill("db.example:5432");
  await expandAdvancedSettings(page);
  await openManualCertSection(page);
  const cert = page.getByPlaceholder("e.g. copy/paste the cert in PEM format");
  const key = page.getByPlaceholder("e.g. copy/paste the key in PEM format");
  await cert.fill(certText);
  await key.fill(keyText);
  await expect(cert).toHaveValue(certText);
  await expect(key).toHaveValue(keyText);
  const id = await saveAndWaitForView(page);

  await gotoEditForm(page, id);
  await expandAdvancedSettings(page);
  if (hasCertStore) {
    await page.getByText("Set client certificate manually", { exact: true }).click();
  }
  await expect(page.getByRole("button", { name: "Details" })).toBeVisible();
});

test("OS certificate store search and its filters persist through save and edit", async ({
  page,
}) => {
  test.skip(!hasCertStore, "the OS certificate store is only searched on macOS and Windows");
  const id = await createConnection(page, {
    name: "E2E Cert Store",
    destination: "db.example:5432",
  });

  await gotoEditForm(page, id);
  await expandAdvancedSettings(page);
  await page.getByRole("switch", { name: "Search OS certificate store" }).check();
  await page.getByText("Additional OS certificate store filters").click();

  const setFilter = async (index: number, attribute: string, value: string) => {
    await page.getByRole("combobox", { name: "Attribute" }).nth(index).click();
    await page.getByRole("option", { name: new RegExp(`^${attribute} \\(`) }).click();
    await page.getByLabel("Value").nth(index).fill(value);
  };
  await setFilter(0, "CN", "E2E Issuing CA");
  await setFilter(1, "O", "Pomerium E2E");
  await saveAndWaitForView(page);

  await gotoEditForm(page, id);
  await expandAdvancedSettings(page);
  await expect(page.getByRole("switch", { name: "Search OS certificate store" })).toBeChecked();
  // The collapsed filters accordion summarizes what is set.
  await expect(page.getByText("Issuer CN=E2E Issuing CA, Subject O=Pomerium E2E")).toBeVisible();

  // Turning the search off removes the filters too.
  await page.getByRole("switch", { name: "Search OS certificate store" }).uncheck();
  await saveAndWaitForView(page);
  await gotoEditForm(page, id);
  await expandAdvancedSettings(page);
  await expect(page.getByRole("switch", { name: "Search OS certificate store" })).not.toBeChecked();
  await expect(page.getByText(/Issuer CN=E2E Issuing CA/)).toHaveCount(0);
});

// Saves a connection with "Start connection at app launch" on, then quits and
// relaunches the app on the same profile.
const relaunchWithAutostartConnection = async (
  electronApp: ElectronApplication,
  page: Page,
  tempHome: string,
  echoPort: number,
  localPort: number,
) => {
  await gotoRoute(page, "#/connectForm");
  await page.getByLabel("Name").fill("E2E Autostart");
  await page.getByLabel("Destination").fill(`127.0.0.1:${echoPort}`);
  await page.getByLabel("Local Address").fill(`127.0.0.1:${localPort}`);
  await page.getByRole("switch", { name: "Start connection at app launch" }).check();
  const id = await saveAndWaitForView(page);
  // Saving doesn't connect it.
  await expect(page.getByRole("button", { name: "Connect", exact: true })).toBeVisible();

  await quitApp(electronApp);
  const relaunched = await launchApp(tempHome);
  return { id, relaunched, relaunchedPage: await openMainWindow(relaunched) };
};

test("a connection set to start at app launch is listening after a relaunch", async ({
  electronApp,
  page,
  tempHome,
}) => {
  const echo = await startEchoServer();
  const localPort = await findFreePort();
  let relaunched: ElectronApplication | undefined;
  try {
    const started = await relaunchWithAutostartConnection(
      electronApp,
      page,
      tempHome,
      echo.port,
      localPort,
    );
    relaunched = started.relaunched;
    const relaunchedPage = started.relaunchedPage;
    await expectListenerAcceptsConnection(localPort, "e2e-autostart");

    // Reopen the list so it reads the current status (see the next test).
    await gotoEditForm(relaunchedPage, started.id);
    await expect(
      relaunchedPage.getByRole("switch", { name: "Start connection at app launch" }),
    ).toBeChecked();
    await gotoRoute(relaunchedPage, "#/manage");
    await relaunchedPage.getByRole("button", { name: "toggle listeners for Untagged" }).click();
    await expect(
      relaunchedPage.getByText(`Listening on 127.0.0.1:${localPort}`, { exact: true }),
    ).toBeVisible();
  } finally {
    if (relaunched) await quitApp(relaunched);
    await echo.close();
  }
});

test("the connection list shows an autostarted connection as listening without a reload", async ({
  electronApp,
  page,
  tempHome,
}) => {
  // The list reads listener status once when it opens. If that happens before
  // autostart finishes, it shows "Inactive" until reopened (#634).
  test.fixme(!runFixme, "https://github.com/pomerium/desktop-client/issues/634");
  const echo = await startEchoServer();
  const localPort = await findFreePort();
  let relaunched: ElectronApplication | undefined;
  try {
    const started = await relaunchWithAutostartConnection(
      electronApp,
      page,
      tempHome,
      echo.port,
      localPort,
    );
    relaunched = started.relaunched;
    await expectListenerAcceptsConnection(localPort, "e2e-autostart");
    await started.relaunchedPage
      .getByRole("button", { name: "toggle listeners for Untagged" })
      .click();
    await expect(
      started.relaunchedPage.getByText(`Listening on 127.0.0.1:${localPort}`, { exact: true }),
    ).toBeVisible();
  } finally {
    if (relaunched) await quitApp(relaunched);
    await echo.close();
  }
});

test("Back asks before discarding unsaved changes", async ({ page }) => {
  // No changes: Back goes straight to the list.
  await gotoRoute(page, "#/connectForm");
  await page.getByRole("button", { name: "Back" }).click();
  await expect.poll(() => routeOf(page)).toBe("#/manage");

  await gotoRoute(page, "#/connectForm");
  await page.getByLabel("Name").fill("Unsaved");
  await page.getByRole("button", { name: "Back" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("Go Back?", { exact: true })).toBeVisible();
  await expect(
    dialog.getByText("You have unsaved changes which will be lost if you leave this page."),
  ).toBeVisible();

  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toHaveCount(0);
  expect(await routeOf(page)).toBe("#/connectForm");
  await expect(page.getByLabel("Name")).toHaveValue("Unsaved");

  await page.getByRole("button", { name: "Back" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Back" }).click();
  await expect.poll(() => routeOf(page)).toBe("#/manage");
  await page.getByRole("button", { name: "toggle listeners for Untagged" }).click();
  await expect(page.getByText("Unsaved", { exact: true })).toHaveCount(0);
});

test("Back on an edited connection asks before discarding changes", async ({ page }) => {
  const id = await createConnection(page, {
    name: "E2E Edit Back",
    destination: "db.example:5432",
  });
  await gotoEditForm(page, id);
  // Opening the edit form without changing anything isn't a change.
  await page.getByRole("button", { name: "Back" }).click();
  await expect.poll(() => routeOf(page)).toBe("#/manage");

  await gotoEditForm(page, id);
  await page.getByLabel("Name").fill("E2E Edit Back Changed");
  await page.getByRole("button", { name: "Back" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Back" }).click();
  await expect.poll(() => routeOf(page)).toBe("#/manage");
  await page.getByRole("button", { name: "toggle listeners for Untagged" }).click();
  await expect(page.getByText("E2E Edit Back", { exact: true })).toBeVisible();
  await expect(page.getByText("E2E Edit Back Changed", { exact: true })).toHaveCount(0);
});
