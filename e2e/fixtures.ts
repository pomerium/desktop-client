import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  test as base,
  expect,
  _electron as electron,
  type ElectronApplication,
  type Page,
} from "@playwright/test";
import electronBinary from "electron";

import { GET_ALL_RECORDS } from "../src/shared/constants";

const repoRoot = path.resolve(__dirname, "..");

// Renderer console messages that are known and unrelated to the change under
// test. Keep this list short: every entry hides a real problem.
const IGNORED_CONSOLE_ERRORS: RegExp[] = [
  // Electron's own security warnings only appear in unpackaged builds.
  /Electron Security Warning/,
];

type AppFixtures = {
  /** Throwaway HOME used for the CLI config and Electron profile. */
  tempHome: string;
  electronApp: ElectronApplication;
  /** The main application window (not the hidden menubar window). */
  page: Page;
  /** Renderer console errors and page errors collected during the test. */
  consoleErrors: string[];
};

// Create the CLI's config directory for each OS ahead of time. Without it the
// CLI fails to save with "open …/PomeriumDesktop/config.json: no such file".
const prepareHome = async (home: string) => {
  const configDirs = [
    path.join(home, "Library", "Application Support"),
    path.join(home, ".config"),
    path.join(home, "AppData", "Roaming"),
  ];
  await Promise.all(
    [
      ...configDirs.map((dir) => path.join(dir, "PomeriumDesktop")),
      path.join(home, "AppData", "Local"),
      path.join(home, "tmp"),
      path.join(home, "userData"),
    ].map((dir) => fs.mkdir(dir, { recursive: true })),
  );
};

// Kills a process and its children (the app spawns pomerium-cli).
const killTree = (pid: number) => {
  try {
    if (process.platform === "win32") {
      execFileSync("taskkill", ["/pid", String(pid), "/T", "/F"], { stdio: "ignore" });
    } else {
      execFileSync("pkill", ["-KILL", "-P", String(pid)], { stdio: "ignore" });
      process.kill(pid, "SIGKILL");
    }
  } catch {
    // Already gone.
  }
};

const quitApp = async (electronApp: ElectronApplication) => {
  const pid = electronApp.process().pid;
  // The main window hides instead of closing. Drop that handler on every
  // window, then quit; before-quit stops the CLI.
  await electronApp
    .evaluate(({ app, BrowserWindow }) => {
      for (const w of BrowserWindow.getAllWindows()) w.removeAllListeners("close");
      app.quit();
    })
    .catch(() => {});
  const closed = await Promise.race([
    electronApp.close().then(
      () => true,
      () => true,
    ),
    new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 10_000)),
  ]);
  if (!closed && pid) {
    // Don't leave an instance behind holding the single-instance lock.
    console.warn(`[e2e] app (pid ${pid}) did not exit within 10s; killing it`);
    killTree(pid);
  }
};

const findMainWindow = async (electronApp: ElectronApplication): Promise<Page> => {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    for (const candidate of electronApp.windows()) {
      try {
        // menubar preloads a second, 0x0 window with the same renderer.
        const width = await electronApp
          .browserWindow(candidate)
          .then((bw) => bw.evaluate((w) => w.getSize()[0]));
        if (width > 100) {
          return candidate;
        }
      } catch {
        // The window may not be ready yet, or it may have been replaced.
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("failed to find the main application window");
};

export const test = base.extend<AppFixtures>({
  // oxlint-disable-next-line no-empty-pattern
  tempHome: async ({}, use) => {
    const home = await fs.mkdtemp(path.join(os.tmpdir(), "pomerium-desktop-e2e-"));
    await prepareHome(home);
    await use(home);
    await fs.rm(home, { recursive: true, force: true, maxRetries: 5 }).catch(() => {});
  },

  electronApp: async ({ tempHome }, use) => {
    const args = [".", `--user-data-dir=${path.join(tempHome, "userData")}`];
    if (process.platform === "linux") {
      args.push("--no-sandbox");
    }
    const electronApp = await electron.launch({
      executablePath: electronBinary as unknown as string,
      args,
      cwd: repoRoot,
      env: {
        ...process.env,
        HOME: tempHome,
        USERPROFILE: tempHome,
        XDG_CONFIG_HOME: path.join(tempHome, ".config"),
        APPDATA: path.join(tempHome, "AppData", "Roaming"),
        LOCALAPPDATA: path.join(tempHome, "AppData", "Local"),
        TMPDIR: path.join(tempHome, "tmp"),
        NODE_ENV: "production",
      },
    });
    // The main process registers its IPC handlers and its before-quit handler
    // (which lets the window close and stops the CLI) only once the tray is
    // ready. Quitting earlier just hides the window and leaves the app running,
    // holding the single-instance lock, so wait for that first.
    await expect
      .poll(
        () =>
          electronApp.evaluate(
            ({ ipcMain }, channel) => ipcMain.listenerCount(channel),
            GET_ALL_RECORDS,
          ),
        {
          message: "main process IPC handlers registered",
          timeout: 30_000,
        },
      )
      .toBeGreaterThan(0);
    await use(electronApp);
    await quitApp(electronApp);
  },

  consoleErrors: [
    // oxlint-disable-next-line no-empty-pattern
    async ({}, use) => {
      await use([]);
    },
    { scope: "test" },
  ],

  page: async ({ electronApp, consoleErrors }, use, testInfo) => {
    const page = await findMainWindow(electronApp);
    page.on("console", (msg) => {
      if (msg.type() !== "error") return;
      const text = msg.text();
      if (IGNORED_CONSOLE_ERRORS.some((re) => re.test(text))) return;
      consoleErrors.push(`console.error: ${text}`);
    });
    page.on("pageerror", (error) => {
      consoleErrors.push(`pageerror: ${error.message}`);
    });
    await page.waitForLoadState("domcontentloaded");
    await expect(page.getByText("Manage Connections", { exact: true })).toBeVisible({
      timeout: 30_000,
    });

    await use(page);

    if (testInfo.status !== testInfo.expectedStatus) {
      await page
        .screenshot({ path: testInfo.outputPath("failure.png"), fullPage: true })
        .catch(() => {});
    }
    // Fail the test on any renderer error, even if every assertion passed.
    expect(consoleErrors, "renderer console errors").toEqual([]);
  },
});

export { expect };
