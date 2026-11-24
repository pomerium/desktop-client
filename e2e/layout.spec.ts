import type { Page } from "@playwright/test";

import { test, expect } from "./fixtures";
import {
  createConnection,
  findFreePort,
  gotoRoute,
  measureLayout,
  setColorScheme,
  setViewportWidth,
  startEchoServer,
  type EchoServer,
} from "./helpers";

// Bounding-box checks instead of pixel snapshots: fonts and anti-aliasing vary
// across operating systems, but "nothing sticks out of the window" and "the
// Logs rows span the panel" hold everywhere. These would have caught #624 and
// #629.

const WIDTHS = [420, 700, 1600] as const;
const SCHEMES = ["light", "dark"] as const;

const checkLayoutEverywhere = async (
  page: Page,
  electronApp: import("@playwright/test").ElectronApplication,
  label: string,
  ready: () => Promise<void>,
  extraChecks?: (width: number) => Promise<void>,
) => {
  for (const scheme of SCHEMES) {
    await setColorScheme(electronApp, page, scheme);
    for (const width of WIDTHS) {
      await test.step(`${label} @ ${width}px ${scheme}`, async () => {
        await setViewportWidth(page, width);
        await ready();
        // Let MUI transitions and resize observers settle.
        await page.waitForTimeout(150);
        const report = await measureLayout(page);
        expect
          .soft(report.scrollWidth, `${label} ${width}px ${scheme}: horizontal scroll`)
          .toBeLessThanOrEqual(report.clientWidth);
        expect
          .soft(report.offscreen, `${label} ${width}px ${scheme}: off-screen elements`)
          .toEqual([]);
        await extraChecks?.(width);
        await test.info().attach(`${label}-${width}-${scheme}.png`, {
          body: await page.screenshot({ fullPage: true }),
          contentType: "image/png",
        });
      });
    }
  }
};

type LogsMeasurement = {
  summaryContent: number;
  headerRow: number;
  detailsWidth: number;
  rows: number[];
};

// The Logs accordion on the connection view. Its header row and each log row
// must fill the panel; under MUI v9 they shrank to their content (#629).
const measureLogsPanel = (page: Page): Promise<LogsMeasurement> =>
  page.evaluate(() => {
    const summary = document.getElementById("log-header");
    if (!summary) throw new Error("Logs panel header (#log-header) not found");
    const accordion = summary.closest(".MuiAccordion-root");
    const content = summary.querySelector(".MuiAccordionSummary-content");
    const title = Array.from(summary.querySelectorAll("h5")).find(
      (el) => el.textContent?.trim() === "Logs",
    );
    const headerRow = title?.closest(".MuiGrid-container");
    const details = accordion?.querySelector(".MuiAccordionDetails-root > .MuiGrid-container");
    if (!content || !headerRow || !details) {
      throw new Error("Logs panel structure not found");
    }
    const width = (el: Element) => el.getBoundingClientRect().width;
    return {
      summaryContent: width(content),
      headerRow: width(headerRow),
      detailsWidth: width(details),
      rows: Array.from(details.children).map(width),
    };
  });

let echo: EchoServer;

test.beforeEach(async () => {
  echo = await startEchoServer();
});

test.afterEach(async () => {
  await echo?.close();
});

test("manage connections page fits at every width", async ({ electronApp, page }) => {
  await createConnection(page, { name: "Layout Row", destination: `127.0.0.1:${echo.port}` });
  await gotoRoute(page, "#/manage");
  await checkLayoutEverywhere(page, electronApp, "manage", async () => {
    await expect(page.getByText("Manage Connections", { exact: true })).toBeVisible();
  });
});

test("add connection form fits at every width", async ({ electronApp, page }) => {
  await gotoRoute(page, "#/connectForm");
  await checkLayoutEverywhere(page, electronApp, "connectForm", async () => {
    await expect(page.getByText("Add Connection", { exact: true })).toBeVisible();
  });
});

test("load connections form fits at every width", async ({ electronApp, page }) => {
  await gotoRoute(page, "#/loadForm");
  await checkLayoutEverywhere(page, electronApp, "loadForm", async () => {
    await expect(page.getByText("Load Connections", { exact: true })).toBeVisible();
  });
});

test("edit connection form fits at every width", async ({ electronApp, page }) => {
  const id = await createConnection(page, {
    name: "Layout Edit",
    destination: `127.0.0.1:${echo.port}`,
  });
  await gotoRoute(page, `#/edit_connect/${id}`);
  await checkLayoutEverywhere(page, electronApp, "editConnect", async () => {
    await expect(page.getByText("Edit Connection", { exact: true })).toBeVisible();
  });
});

test("connection view and Logs panel fit at every width", async ({ electronApp, page }) => {
  const localPort = await findFreePort();
  await createConnection(page, {
    name: "Layout View",
    destination: `127.0.0.1:${echo.port}`,
    localAddress: `127.0.0.1:${localPort}`,
  });

  // Connect and disconnect so the Logs panel has rows to measure.
  await page.getByRole("button", { name: "Connect", exact: true }).click();
  await expect(page.getByRole("button", { name: "Disconnect", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Disconnect", exact: true }).click();
  await expect(page.getByRole("button", { name: "Connect", exact: true })).toBeVisible();

  await page.locator("#log-header").click();
  await expect(page.getByRole("button", { name: "Export Logs" }).first()).toBeVisible();

  await checkLayoutEverywhere(
    page,
    electronApp,
    "viewConnection",
    async () => {
      await expect(page.getByText("Layout View", { exact: true })).toBeVisible();
    },
    async (width) => {
      const logs = await measureLogsPanel(page);
      expect.soft(logs.rows.length, "log rows").toBeGreaterThan(0);
      // Allow a pixel of rounding.
      expect
        .soft(logs.headerRow, `${width}px: Logs header row fills the panel header`)
        .toBeGreaterThanOrEqual(logs.summaryContent - 1);
      logs.rows.forEach((row, i) => {
        expect
          .soft(row, `${width}px: log row ${i} fills the panel`)
          .toBeGreaterThanOrEqual(logs.detailsWidth - 1);
      });
    },
  );
});
