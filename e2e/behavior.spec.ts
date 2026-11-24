import type { ElectronApplication } from "@playwright/test";

import pkg from "../package.json";
import { FETCH_ROUTES } from "../src/shared/constants";
import { test, expect } from "./fixtures";
import { gotoRoute } from "./helpers";

test("header shows the desktop and CLI versions of this build", async ({ page }) => {
  // Version guard: results must never be attributed to the wrong build.
  await expect(page.getByText(new RegExp(`^Version: ${pkg.version}-[0-9a-f]+$`))).toBeVisible();
  await expect(
    page.getByText(`CLI Version: ${pkg.pomeriumCli.version}`, { exact: true }),
  ).toBeVisible();
});

test("Save is disabled until the add connection form has a name and destination", async ({
  page,
}) => {
  await gotoRoute(page, "#/connectForm");
  const save = page.getByRole("button", { name: "Save" });
  await expect(save).toBeDisabled();

  await page.getByLabel("Name").fill("Only a name");
  await expect(save).toBeDisabled();

  await page.getByLabel("Destination").fill("127.0.0.1:9");
  await expect(save).toBeEnabled();

  await page.getByLabel("Name").fill("");
  await expect(save).toBeDisabled();
});

type PortalRoute = { id: string; name: string; type: string; from: string };

// Fetching routes needs a browser sign-in against a real Pomerium server, so
// stand in for the CLI's FetchRoutes call in the main process. Everything
// after it (reconciling and saving records through the CLI) is real.
const mockFetchRoutes = async (electronApp: ElectronApplication, routes: PortalRoute[]) => {
  await electronApp.evaluate(
    ({ ipcMain }, { channel, mockRoutes }) => {
      ipcMain.removeAllListeners(channel);
      ipcMain.on(channel, (evt) => {
        evt.sender.send(channel, { err: null, res: { routes: mockRoutes } });
      });
    },
    { channel: FETCH_ROUTES, mockRoutes: routes },
  );
};

test("Load Connections imports TCP and UDP routes from a Pomerium URL", async ({
  electronApp,
  page,
}) => {
  await mockFetchRoutes(electronApp, [
    { id: "r1", name: "E2E TCP Route", type: "tcp", from: "tcp+https://db.example.com:5432" },
    { id: "r2", name: "E2E UDP Route", type: "udp", from: "udp+https://dns.example.com:53" },
    { id: "r3", name: "E2E HTTP Route", type: "http", from: "https://app.example.com" },
  ]);

  await gotoRoute(page, "#/manage");
  await page.getByRole("button", { name: "New Connection" }).click();
  await page.getByRole("menuitem", { name: "Load Connections" }).click();
  await expect.poll(() => page.evaluate(() => window.location.hash)).toBe("#/loadForm");

  const load = page.getByRole("button", { name: "Load" });
  await page.getByLabel("Pomerium URL").fill("https://pomerium.example.com");
  await load.click();

  await expect(page.getByText("Imported 2 routes", { exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.location.hash)).toBe("#/manage");
  await page.getByRole("button", { name: "toggle listeners for Untagged" }).click();
  await expect(page.getByText("E2E TCP Route", { exact: true })).toBeVisible();
  await expect(page.getByText("E2E UDP Route", { exact: true })).toBeVisible();
  // Only tcp+https and udp+https routes can be imported.
  await expect(page.getByText("E2E HTTP Route", { exact: true })).toHaveCount(0);
});

test("Load Connections warns when the server has no TCP or UDP routes", async ({
  electronApp,
  page,
}) => {
  await mockFetchRoutes(electronApp, [
    { id: "r1", name: "Web App", type: "http", from: "https://app.example.com" },
  ]);
  await gotoRoute(page, "#/loadForm");
  await page.getByLabel("Pomerium URL").fill("https://pomerium.example.com");
  await page.getByRole("button", { name: "Load" }).click();
  await expect(page.getByText(/No TCP or UDP routes found/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Open routes portal" })).toBeVisible();
  await page.getByRole("button", { name: "Dismiss" }).click();
  await expect(page.getByText(/No TCP or UDP routes found/)).toHaveCount(0);
});

// Export and import are covered end to end in lifecycle.spec.ts.
