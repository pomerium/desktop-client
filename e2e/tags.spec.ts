import type { ElectronApplication, Page } from "@playwright/test";

import { FETCH_ROUTES } from "../src/shared/constants";
import { test, expect, runFixme } from "./fixtures";
import {
  addTag,
  createConnection,
  expandAdvancedSettings,
  expectListenerAcceptsConnection,
  expectPortClosed,
  findFreePort,
  gotoEditForm,
  gotoRoute,
  installDownloadCapture,
  captureDownload,
  menuItem,
  routeOf,
  startEchoServer,
} from "./helpers";

const folderMenu = (page: Page, tag: string) =>
  page.getByRole("button", { name: `Menu for folder: ${tag}` });

const folderStatus = (page: Page, tag: string) =>
  page
    .getByRole("button", { name: `toggle listeners for ${tag}`, exact: true })
    .locator('xpath=ancestor::div[contains(@class, "MuiGrid-container")][1]')
    .getByText(/ of \d+ listening$/);

test("tags group connections, and the tag folder connects, disconnects, exports and deletes them", async ({
  page,
}) => {
  const tag = "e2e-team";
  const echo = await startEchoServer();
  try {
    const ports = [await findFreePort(), await findFreePort()];
    await createConnection(page, {
      name: "E2E Tagged One",
      destination: `127.0.0.1:${echo.port}`,
      localAddress: `127.0.0.1:${ports[0]}`,
      tags: [tag],
    });
    await createConnection(page, {
      name: "E2E Tagged Two",
      destination: `127.0.0.1:${echo.port}`,
      localAddress: `127.0.0.1:${ports[1]}`,
      tags: [tag, "e2e-other"],
    });
    await createConnection(page, { name: "E2E Untagged", destination: "db.example:5432" });

    await gotoRoute(page, "#/manage");
    await installDownloadCapture(page);
    await expect(folderStatus(page, tag)).toHaveText("0 of 2 listening");
    await expect(folderStatus(page, "e2e-other")).toHaveText("0 of 1 listening");
    await expect(folderStatus(page, "Untagged")).toHaveText("0 of 1 listening");

    await page.getByRole("button", { name: `toggle listeners for ${tag}`, exact: true }).click();
    await expect(page.getByText("E2E Tagged One", { exact: true })).toBeVisible();
    await expect(page.getByText("E2E Tagged Two", { exact: true })).toBeVisible();
    await expect(page.getByText("E2E Untagged", { exact: true })).toHaveCount(0);

    await test.step("connect all", async () => {
      await folderMenu(page, tag).click();
      await menuItem(page, "Connect All").click();
      await expect(folderStatus(page, tag)).toHaveText("2 of 2 listening");
      await expectListenerAcceptsConnection(ports[0], "e2e-tag-1");
      await expectListenerAcceptsConnection(ports[1], "e2e-tag-2");
    });

    await test.step("disconnect all", async () => {
      await folderMenu(page, tag).click();
      await menuItem(page, "Disconnect All").click();
      await expect(folderStatus(page, tag)).toHaveText("0 of 2 listening");
      await expectPortClosed(ports[0]);
      await expectPortClosed(ports[1]);
    });

    await test.step("export the tag, with and without tags", async () => {
      let download = await captureDownload(page, async () => {
        await folderMenu(page, tag).click();
        await menuItem(page, "Export").click();
        await page.getByRole("dialog").getByRole("button", { name: "Export" }).click();
      });
      expect(download.filename).toBe(`${tag}.json`);
      expect(download.text).toContain("E2E Tagged One");
      expect(download.text).toContain("E2E Tagged Two");
      expect(download.text).not.toContain("E2E Untagged");
      expect(download.text).not.toContain(tag);

      download = await captureDownload(page, async () => {
        await folderMenu(page, tag).click();
        await menuItem(page, "Export").click();
        const dialog = page.getByRole("dialog");
        await dialog.getByRole("checkbox", { name: "Include Tags" }).check();
        await dialog.getByRole("button", { name: "Export" }).click();
      });
      expect(download.text).toContain(tag);
    });

    await test.step("delete the tag's connections", async () => {
      await folderMenu(page, tag).click();
      await menuItem(page, "Delete").click();
      const dialog = page.getByRole("dialog");
      await expect(dialog.getByText("Delete connections?")).toBeVisible();
      await expect(
        dialog.getByText(`All connections with tag ${tag} will be deleted.`),
      ).toBeVisible();

      // Cancel keeps them.
      await dialog.getByRole("button", { name: "Cancel" }).click();
      // The folder menu stays open after Cancel (see the next test), so close it.
      await page.keyboard.press("Escape");
      await expect(menuItem(page, "Delete")).toHaveCount(0);
      await expect(folderStatus(page, tag)).toHaveText("0 of 2 listening");

      await folderMenu(page, tag).click();
      await menuItem(page, "Delete").click();
      await page.getByRole("dialog").getByRole("button", { name: "OK" }).click();
      await expect(
        page.getByRole("button", { name: `toggle listeners for ${tag}`, exact: true }),
      ).toHaveCount(0);
      // Deleting by tag removes the connections, including ones with other
      // tags too, so the other folder goes away as well.
      await expect(folderStatus(page, "All Connections")).toHaveText("0 of 1 listening");
      await expect(
        page.getByRole("button", { name: "toggle listeners for e2e-other", exact: true }),
      ).toHaveCount(0);
    });
  } finally {
    await echo.close();
  }
});

test("cancelling a tag delete closes the folder menu", async ({ page }) => {
  // Choosing Delete opens the confirmation without closing the menu, and only
  // OK closes it, so after Cancel the menu is still open (#639).
  test.fixme(!runFixme, "https://github.com/pomerium/desktop-client/issues/639");
  await createConnection(page, {
    name: "E2E Cancel Delete",
    destination: "db.example:5432",
    tags: ["e2e-keep"],
  });
  await gotoRoute(page, "#/manage");
  await folderMenu(page, "e2e-keep").click();
  await menuItem(page, "Delete").click();
  await page.getByRole("dialog").getByRole("button", { name: "Cancel" }).click();
  await expect(menuItem(page, "Delete")).toHaveCount(0);
  await expect(folderStatus(page, "e2e-keep")).toHaveText("0 of 1 listening");
});

test("tags are shown and editable on the edit form", async ({ page }) => {
  const id = await createConnection(page, {
    name: "E2E Tag Edit",
    destination: "db.example:5432",
    tags: ["e2e-first"],
  });
  await gotoEditForm(page, id);
  await expect(page.getByRole("button", { name: "e2e-first", exact: true })).toBeVisible();
  await addTag(page, "e2e-second");
  await page.getByRole("button", { name: "Save" }).click();
  await page.waitForFunction(() => /^#\/view_connection\/.+/.test(window.location.hash));

  await gotoRoute(page, "#/manage");
  await expect(folderStatus(page, "e2e-first")).toHaveText("0 of 1 listening");
  await expect(folderStatus(page, "e2e-second")).toHaveText("0 of 1 listening");
  await expect(folderStatus(page, "Untagged")).toHaveText("0 of 0 listening");
});

type PortalRoute = { id: string; name: string; type: string; from: string };

// Stand in for the CLI's FetchRoutes call (it needs a browser sign-in) and
// record the request, so the test can check which settings were sent.
const mockFetchRoutes = async (electronApp: ElectronApplication, routes: PortalRoute[]) => {
  await electronApp.evaluate(
    ({ ipcMain }, { channel, mockRoutes }) => {
      const scope = globalThis as typeof globalThis & { e2eFetchRoutesRequests?: unknown[] };
      scope.e2eFetchRoutesRequests = [];
      ipcMain.removeAllListeners(channel);
      ipcMain.on(channel, (evt, args) => {
        scope.e2eFetchRoutesRequests?.push(args);
        evt.sender.send(channel, { err: null, res: { routes: mockRoutes } });
      });
    },
    { channel: FETCH_ROUTES, mockRoutes: routes },
  );
};

const fetchRoutesRequests = (electronApp: ElectronApplication) =>
  electronApp.evaluate(
    () =>
      (globalThis as typeof globalThis & { e2eFetchRoutesRequests?: Record<string, unknown>[] })
        .e2eFetchRoutesRequests ?? [],
  );

test("Load Connections applies its tags and advanced settings to the imported connections", async ({
  electronApp,
  page,
}) => {
  await mockFetchRoutes(electronApp, [
    { id: "r1", name: "E2E Loaded DB", type: "tcp", from: "tcp+https://db.example.com:5432" },
  ]);
  const hasCertStore = process.platform === "darwin" || process.platform === "win32";

  await gotoRoute(page, "#/loadForm");
  await page.getByLabel("Pomerium URL").fill("https://pomerium.example.com");
  await addTag(page, "e2e-loaded");
  await expandAdvancedSettings(page);
  await page.getByRole("switch", { name: "Disable TLS Verification" }).check();
  if (hasCertStore) {
    await page.getByRole("switch", { name: "Search OS certificate store" }).check();
    await page.getByText("Additional OS certificate store filters").click();
    await page.getByRole("combobox", { name: "Attribute" }).first().click();
    await page.getByRole("option", { name: /^CN \(/ }).click();
    await page.getByLabel("Value").fill("E2E Issuing CA");
  }
  await page.getByRole("button", { name: "Load", exact: true }).click();
  await expect(page.getByText("Imported 1 route", { exact: true })).toBeVisible();
  await expect.poll(() => routeOf(page)).toBe("#/manage");

  const [request] = await fetchRoutesRequests(electronApp);
  expect(request).toMatchObject({
    serverUrl: "https://pomerium.example.com",
    disableTlsVerification: true,
  });
  if (hasCertStore) {
    expect(request.clientCertFromStore).toMatchObject({ issuerFilter: "CN=E2E Issuing CA" });
  }

  await expect(folderStatus(page, "e2e-loaded")).toHaveText("0 of 1 listening");
  await page.getByRole("button", { name: "toggle listeners for e2e-loaded", exact: true }).click();
  await page.getByRole("button", { name: "Menu for listener: e2e-loaded-E2E Loaded DB" }).click();
  await menuItem(page, "Edit").click();
  await expect(page.getByText("Edit Connection", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Name")).toHaveValue("E2E Loaded DB");
  await expect(page.getByLabel("Destination")).toHaveValue("db.example.com:5432");
  await expect(page.getByRole("button", { name: "e2e-loaded", exact: true })).toBeVisible();
  await expandAdvancedSettings(page);
  await expect(page.getByRole("switch", { name: "Disable TLS Verification" })).toBeChecked();
  if (hasCertStore) {
    await expect(page.getByRole("switch", { name: "Search OS certificate store" })).toBeChecked();
    await expect(page.getByText("Issuer CN=E2E Issuing CA")).toBeVisible();
  }
});
