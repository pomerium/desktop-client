import fs from "node:fs/promises";
import path from "node:path";

import { test, expect } from "./fixtures";
import {
  createConnection,
  findFreePort,
  gotoRoute,
  setColorScheme,
  setViewportWidth,
  startEchoServer,
} from "./helpers";

// Captures the pages compared side by side in the release comparison comment
// (see .github/workflows/e2e.yml). It runs against both this build and the
// latest release, so it sticks to selectors that stay the same across
// versions: routes, visible text and labels.
//
// Only runs when E2E_SCREENSHOT_DIR is set: `npm run test:e2e` skips it.

const outDir = process.env.E2E_SCREENSHOT_DIR;

test.skip(!outDir, "set E2E_SCREENSHOT_DIR to capture comparison screenshots");

test("capture comparison screenshots", async ({ electronApp, page }) => {
  const dir = path.resolve(outDir!);
  await fs.mkdir(dir, { recursive: true });
  const shot = async (name: string) => {
    // Let transitions and snackbars settle.
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(dir, `${name}.png`) });
  };

  const version =
    (
      await page
        .getByText(/^Version: /)
        .first()
        .textContent()
    )?.trim() ?? "";
  const cliVersion =
    (
      await page
        .getByText(/^CLI Version: /)
        .first()
        .textContent()
    )?.trim() ?? "";
  await fs.writeFile(
    path.join(dir, "meta.json"),
    JSON.stringify({
      version: version.replace(/^Version: /, ""),
      cliVersion: cliVersion.replace(/^CLI Version: /, ""),
    }),
  );

  await setColorScheme(electronApp, page, "light");
  await setViewportWidth(page, 1024);

  await gotoRoute(page, "#/connectForm");
  await expect(page.getByText("Add Connection", { exact: true })).toBeVisible();
  await shot("new-connection");

  await gotoRoute(page, "#/loadForm");
  await expect(page.getByText("Load Connections", { exact: true })).toBeVisible();
  await shot("load");

  const echo = await startEchoServer();
  try {
    const localPort = await findFreePort();
    await createConnection(page, {
      name: "Comparison",
      destination: `127.0.0.1:${echo.port}`,
      localAddress: `127.0.0.1:${localPort}`,
    });
    await shot("view");

    await page.getByRole("button", { name: "Connect", exact: true }).click();
    await expect(page.getByRole("button", { name: "Disconnect", exact: true })).toBeVisible();
    await page.locator("#log-header").click();
    await expect(page.getByRole("button", { name: "Export Logs" }).first()).toBeVisible();
    await shot("connected");
    await page.getByRole("button", { name: "Disconnect", exact: true }).click();
    await expect(page.getByRole("button", { name: "Connect", exact: true })).toBeVisible();
  } finally {
    await echo.close();
  }

  await gotoRoute(page, "#/manage");
  await page.getByRole("button", { name: "toggle listeners for Untagged" }).click();
  await expect(page.getByText("Comparison", { exact: true })).toBeVisible();
  await shot("manage");

  await setColorScheme(electronApp, page, "dark");
  await setViewportWidth(page, 420);
  await shot("manage-dark-420");
});
