import { test, expect, runFixme } from "./fixtures";
import {
  createConnection,
  findFreePort,
  gotoRoute,
  installDownloadCapture,
  downloadCount,
  lastDownload,
  menuItem,
  routeOf,
  startEchoServer,
} from "./helpers";

// The connection list's own actions: duplicate, search, export everything,
// and the Logs panel's filter and export menu on the connection view.

test("Duplicate copies a connection and opens the copy", async ({ page }) => {
  const id = await createConnection(page, {
    name: "E2E Original",
    destination: "db.example:5432",
    tags: ["e2e-dupe"],
  });
  await gotoRoute(page, "#/manage");
  await page.getByRole("button", { name: "toggle listeners for Untagged" }).click();
  await page.getByRole("button", { name: "toggle listeners for e2e-dupe", exact: true }).click();
  await page.getByRole("button", { name: "Menu for listener: e2e-dupe-E2E Original" }).click();
  await menuItem(page, "Duplicate").click();

  await page.waitForFunction(() => /^#\/view_connection\/.+/.test(window.location.hash));
  const copyId = (await routeOf(page)).replace("#/view_connection/", "");
  expect(copyId).not.toBe(id);
  await expect(page.getByText("E2E Original", { exact: true })).toBeVisible();
  await expect(page.getByText("db.example:5432")).toBeVisible();

  await gotoRoute(page, "#/manage");
  await page.getByRole("button", { name: "toggle listeners for e2e-dupe", exact: true }).click();
  await expect(page.getByText("E2E Original", { exact: true })).toHaveCount(2);
});

test("search finds connections by name, destination and tag", async ({ page }) => {
  await createConnection(page, { name: "Alpha Database", destination: "alpha.example:5432" });
  await createConnection(page, {
    name: "Beta Cache",
    destination: "redis.example:6379",
    tags: ["e2e-caches"],
  });
  await gotoRoute(page, "#/manage");

  const search = page.locator("#search");
  const options = page.getByRole("listbox").getByRole("option");
  const searchFor = async (text: string, expected: string[]) => {
    await search.fill("");
    await search.fill(text);
    // Results keep the CLI's record order, which isn't defined.
    await expect.poll(async () => (await options.allTextContents()).sort()).toEqual(expected);
  };
  await searchFor("Beta", ["Beta Cache"]);
  await searchFor("alpha.example", ["Alpha Database"]);
  await searchFor("e2e-caches", ["Beta Cache"]);
  await searchFor("example", ["Alpha Database", "Beta Cache"]);
  await search.fill("nothing matches");
  await expect(options).toHaveCount(0);

  await searchFor("Beta", ["Beta Cache"]);
  await options.first().click();
  await page.waitForFunction(() => /^#\/view_connection\/.+/.test(window.location.hash));
  await expect(page.getByText("Beta Cache", { exact: true })).toBeVisible();
});

test("Export on the connection list exports every connection", async ({ page }) => {
  await createConnection(page, { name: "E2E Export One", destination: "one.example:1" });
  await createConnection(page, {
    name: "E2E Export Two",
    destination: "two.example:2",
    tags: ["e2e-export"],
  });
  await gotoRoute(page, "#/manage");
  await installDownloadCapture(page);

  await page.getByRole("button", { name: "Export", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("checkbox", { name: "Include Tags" }).check();
  await dialog.getByRole("button", { name: "Export" }).click();
  const download = await lastDownload(page);
  expect(download.filename).toBe("connections.json");
  expect(download.text).toContain("E2E Export One");
  expect(download.text).toContain("E2E Export Two");
  expect(download.text).toContain("e2e-export");
});

test("an export downloads one file, however many pages were visited before", async ({ page }) => {
  // The list and connection view each add an export listener when shown, and
  // removing it on the way out doesn't work through the preload bridge. Every
  // visit adds one more, so one export saves the file many times (#635).
  test.fixme(!runFixme, "https://github.com/pomerium/desktop-client/issues/635");
  const id = await createConnection(page, {
    name: "E2E Export Once",
    destination: "one.example:1",
  });
  await installDownloadCapture(page);
  for (let i = 0; i < 3; i++) {
    await gotoRoute(page, "#/manage");
    await gotoRoute(page, `#/view_connection/${id}`);
  }
  await gotoRoute(page, "#/manage");
  await page.getByRole("button", { name: "Export", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Export" }).click();
  await expect.poll(() => downloadCount(page)).toBeGreaterThan(0);
  // Give any duplicates time to arrive.
  await page.waitForTimeout(1000);
  expect(await downloadCount(page)).toBe(1);
});

test("Export on the connection list is hidden when there are no connections", async ({ page }) => {
  await gotoRoute(page, "#/manage");
  await expect(page.getByRole("button", { name: "Import" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Export", exact: true })).toHaveCount(0);
});

test("the Logs panel filters by level and exports the shown logs", async ({ page }) => {
  const echo = await startEchoServer();
  try {
    const localPort = await findFreePort();
    await createConnection(page, {
      name: "E2E Logs",
      destination: `127.0.0.1:${echo.port}`,
      localAddress: `127.0.0.1:${localPort}`,
    });
    await installDownloadCapture(page);
    await page.getByRole("button", { name: "Connect", exact: true }).click();
    await expect(page.getByRole("button", { name: "Disconnect", exact: true })).toBeVisible();
    await page.locator("#log-header").click();

    // The Logs header is itself a button whose name includes "Export Logs".
    const exportButton = page.getByRole("button", { name: "Export Logs", exact: true }).first();
    await expect(exportButton).toBeEnabled();
    await exportButton.click();
    let download = await lastDownload(page);
    expect(download.filename).toBe("logs.json");
    const all = JSON.parse(download.text) as Array<{ status: string }>;
    expect(all.length).toBeGreaterThan(0);

    // Filtering to one level exports only that level.
    await page.getByRole("button", { name: "Menu for filters/export", exact: true }).click();
    await menuItem(page, "Info").click();
    await page.keyboard.press("Escape");
    await exportButton.click();
    await expect
      .poll(() =>
        page.evaluate(
          () => (window as typeof window & { e2eDownloads?: unknown[] }).e2eDownloads?.length,
        ),
      )
      .toBe(2);
    download = await lastDownload(page);
    const filtered = JSON.parse(download.text) as Array<{ status: string }>;
    expect(filtered.every((log) => log.status === "info")).toBe(true);

    await page.getByRole("button", { name: "Disconnect", exact: true }).click();
    await expect(page.getByRole("button", { name: "Connect", exact: true })).toBeVisible();
  } finally {
    await echo.close();
  }
});
