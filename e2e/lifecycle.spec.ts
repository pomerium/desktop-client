import fs from "node:fs/promises";

import { test, expect } from "./fixtures";
import {
  createConnection,
  expectListenerAcceptsConnection,
  expectPortClosed,
  findFreePort,
  startEchoServer,
  type EchoServer,
} from "./helpers";

// Ported from scripts/acceptance/electron-smoke.ts (#498). A local TCP echo
// server stands in for the remote end, so no Pomerium server or sign-in is
// needed.

type CapturedDownload = { filename: string; text: string };

// Exports go through a blob URL and an <a download> click. Capture them in the
// renderer instead of letting Electron open a save dialog.
const installDownloadCapture = async (page: import("@playwright/test").Page) => {
  await page.evaluate(() => {
    const scope = window as typeof window & {
      e2eDownloads?: CapturedDownload[];
      e2eBlobs?: Map<string, Blob>;
    };
    if (scope.e2eDownloads) return;
    scope.e2eDownloads = [];
    scope.e2eBlobs = new Map();
    const createObjectURL = URL.createObjectURL.bind(URL);
    const click = HTMLAnchorElement.prototype.click;
    URL.createObjectURL = (blob: Blob) => {
      const url = createObjectURL(blob);
      scope.e2eBlobs?.set(url, blob);
      return url;
    };
    HTMLAnchorElement.prototype.click = function clickAnchor(this: HTMLAnchorElement) {
      const blob = scope.e2eBlobs?.get(this.href);
      if (this.download && blob) {
        const filename = this.download;
        void blob.text().then((text) => scope.e2eDownloads?.push({ filename, text }));
        return;
      }
      click.call(this);
    };
  });
};

const lastDownload = async (page: import("@playwright/test").Page) => {
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as typeof window & { e2eDownloads?: unknown[] }).e2eDownloads?.length ?? 0,
      ),
    )
    .toBeGreaterThan(0);
  return page.evaluate(() =>
    (window as typeof window & { e2eDownloads?: CapturedDownload[] }).e2eDownloads!.at(-1)!,
  );
};

const connectionToggle = (page: import("@playwright/test").Page, name: string) =>
  page
    .getByText(name, { exact: true })
    .locator('xpath=ancestor::div[contains(@class, "MuiGrid-container")][1]')
    .getByRole("button")
    .first();

let echo: EchoServer;

test.beforeEach(async () => {
  echo = await startEchoServer();
});

test.afterEach(async () => {
  await echo?.close();
});

test("connection lifecycle: create, connect, disconnect, edit, export, delete, import, reconnect", async ({
  electronApp,
  page,
}, testInfo) => {
  const name = "E2E Lifecycle";
  const editedName = "E2E Lifecycle Edited";
  const localPort = await findFreePort();
  await installDownloadCapture(page);

  await test.step("create", async () => {
    await createConnection(page, {
      name,
      destination: `127.0.0.1:${echo.port}`,
      localAddress: `127.0.0.1:${localPort}`,
    });
  });

  await test.step("connect and check the listener accepts traffic", async () => {
    await page.getByRole("button", { name: "Connect", exact: true }).click();
    await expect(page.getByRole("button", { name: "Disconnect", exact: true })).toBeVisible();
    await expectListenerAcceptsConnection(localPort, "e2e-probe");
  });

  await test.step("disconnect and check the listener closes", async () => {
    await page.getByRole("button", { name: "Disconnect", exact: true }).click();
    await expect(page.getByRole("button", { name: "Connect", exact: true })).toBeVisible();
    await expectPortClosed(localPort);
  });

  await test.step("edit", async () => {
    await page.getByRole("button", { name: "Edit", exact: true }).click();
    await page.waitForFunction(() => /^#\/edit_connect\/.+/.test(window.location.hash));
    await expect(page.getByText("Edit Connection", { exact: true })).toBeVisible();
    await page.getByLabel("Name").fill(editedName);
    await page.getByRole("button", { name: "Save" }).click();
    await page.waitForFunction(() => /^#\/view_connection\/.+/.test(window.location.hash));
    await expect(page.getByText(editedName, { exact: true })).toBeVisible();
  });

  const exportPath = testInfo.outputPath("connection-export.json");
  await test.step("export", async () => {
    await page.getByRole("button", { name: "Export", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "Export", exact: true })).toBeVisible();
    await dialog.getByRole("button", { name: "Export" }).click();
    const download = await lastDownload(page);
    expect(download.text).toContain(editedName);
    expect(download.text).toContain(`127.0.0.1:${echo.port}`);
    await fs.writeFile(exportPath, download.text, "utf8");
  });

  await test.step("delete", async () => {
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await page.waitForFunction(() => window.location.hash === "#/manage");
    await expect(page.getByText(editedName, { exact: true })).toHaveCount(0);
  });

  await test.step("import the exported file", async () => {
    await electronApp.evaluate(({ dialog }, filePath) => {
      dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [filePath] });
    }, exportPath);
    await page.getByRole("button", { name: "Import" }).click();
    await expect(page.getByText("Uploaded Successfully", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "toggle listeners for Untagged" }).click();
    await expect(page.getByText(editedName, { exact: true })).toBeVisible();
  });

  await test.step("reconnect the imported connection from the list", async () => {
    await connectionToggle(page, editedName).click();
    await expect(
      page.getByText(`Listening on 127.0.0.1:${localPort}`, { exact: true }),
    ).toBeVisible();
    await expectListenerAcceptsConnection(localPort, "e2e-probe-imported");

    await connectionToggle(page, editedName).click();
    await expect(
      page.getByText(`Listening on 127.0.0.1:${localPort}`, { exact: true }),
    ).toHaveCount(0);
    await expectPortClosed(localPort);
  });

  await page.screenshot({ path: testInfo.outputPath("lifecycle-end.png"), fullPage: true });
});
