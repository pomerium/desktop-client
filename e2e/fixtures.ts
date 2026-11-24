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

const mainProcessOutput = new WeakMap<ElectronApplication, string[]>();

/** Everything the app's main process has written to stdout and stderr. */
export const mainProcessLog = (electronApp: ElectronApplication) =>
  (mainProcessOutput.get(electronApp) ?? []).join("");

/**
 * Set to a packaged app's executable (for example a mounted release DMG's
 * `Pomerium Desktop.app/Contents/MacOS/Pomerium Desktop`) to test that build
 * instead of the unpackaged `out/` build. Used by the release comparison.
 */
export const appExecutable = process.env.E2E_APP_EXECUTABLE;

/**
 * Tests for known, filed bugs are marked fixme so the suite stays green. Set
 * E2E_RUN_FIXME=1 to run them anyway, for example to check a fix.
 */
export const runFixme = process.env.E2E_RUN_FIXME === "1";

// Older releases may log errors this build has fixed. The comparison run only
// takes screenshots, so it can opt out of failing on them.
const allowConsoleErrors = process.env.E2E_ALLOW_CONSOLE_ERRORS === "1";

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
  let pid: number | undefined;
  try {
    pid = electronApp.process().pid;
  } catch {
    // Already closed, for example by a test that relaunches the app.
    return;
  }
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

/** Launches the app with its CLI config and Electron profile in `home`. */
export const launchApp = async (home: string): Promise<ElectronApplication> => {
  const args = [`--user-data-dir=${path.join(home, "userData")}`];
  if (!appExecutable) {
    args.unshift(".");
  }
  if (process.platform === "linux") {
    args.push("--no-sandbox");
  }
  const electronApp = await electron.launch({
    executablePath: appExecutable ?? (electronBinary as unknown as string),
    args,
    cwd: repoRoot,
    env: {
      ...process.env,
      HOME: home,
      USERPROFILE: home,
      XDG_CONFIG_HOME: path.join(home, ".config"),
      APPDATA: path.join(home, "AppData", "Roaming"),
      LOCALAPPDATA: path.join(home, "AppData", "Local"),
      TMPDIR: path.join(home, "tmp"),
      NODE_ENV: "production",
      POMERIUM_DESKTOP_DISABLE_SENTRY: "1",
    },
  });
  // Keep the main process output (uncaught exceptions are logged there) so a
  // failing test can attach it.
  const output: string[] = [];
  mainProcessOutput.set(electronApp, output);
  electronApp.process().stdout?.on("data", (chunk) => output.push(String(chunk)));
  electronApp.process().stderr?.on("data", (chunk) => output.push(String(chunk)));
  // The main process registers its IPC handlers and its before-quit handler
  // (which lets the window close and stops the CLI) only once the tray is
  // ready. Quitting earlier just hides the window and leaves the app running,
  // holding the single-instance lock, so wait for that first (#638).
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
  // A message box (the main process shows one on an uncaught exception) would
  // block the app until someone clicks it. Record them and answer at once, so
  // the test fails with the message instead of hanging.
  await electronApp.evaluate(({ dialog }) => {
    const scope = globalThis as typeof globalThis & { e2eDialogs?: string[] };
    scope.e2eDialogs = [];
    const record = (kind: string, options: unknown) => {
      const o = (options ?? {}) as { title?: string; message?: string };
      scope.e2eDialogs?.push(`${kind}: ${o.title ?? ""}: ${o.message ?? ""}`);
    };
    const d = dialog as unknown as Record<string, unknown>;
    d.showMessageBox = async (...args: unknown[]) => {
      record("showMessageBox", args.at(-1));
      return { response: 0, checkboxChecked: false };
    };
    d.showMessageBoxSync = (...args: unknown[]) => {
      record("showMessageBoxSync", args.at(-1));
      return 0;
    };
    d.showErrorBox = (title: string, content: string) => {
      record("showErrorBox", { title, message: content });
    };
  });
  return electronApp;
};

/** Message boxes the main process tried to show, if it's still running. */
export const shownDialogs = (electronApp: ElectronApplication): Promise<string[]> =>
  electronApp
    .evaluate(() => (globalThis as typeof globalThis & { e2eDialogs?: string[] }).e2eDialogs ?? [])
    .catch(() => []);

/** Finds the main window and waits for the connection list to render. */
export const openMainWindow = async (electronApp: ElectronApplication): Promise<Page> => {
  const page = await findMainWindow(electronApp);
  await page.waitForLoadState("domcontentloaded");
  await expect(page.getByText("Manage Connections", { exact: true })).toBeVisible({
    timeout: 30_000,
  });
  return page;
};

export { quitApp };

export const test = base.extend<AppFixtures>({
  // oxlint-disable-next-line no-empty-pattern
  tempHome: async ({}, use) => {
    const home = await fs.mkdtemp(path.join(os.tmpdir(), "pomerium-desktop-e2e-"));
    await prepareHome(home);
    await use(home);
    await fs.rm(home, { recursive: true, force: true, maxRetries: 5 }).catch(() => {});
  },

  electronApp: async ({ tempHome }, use, testInfo) => {
    const electronApp = await launchApp(tempHome);
    await use(electronApp);
    const dialogs = await shownDialogs(electronApp);
    await quitApp(electronApp);
    const log = mainProcessLog(electronApp);
    if (log && (testInfo.status !== testInfo.expectedStatus || dialogs.length)) {
      await testInfo.attach("main-process.log", { body: log, contentType: "text/plain" });
    }
    // An error dialog means the main process hit an uncaught exception.
    if (allowConsoleErrors) return;
    expect(dialogs, "main process error dialogs").toEqual([]);
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
    if (allowConsoleErrors) return;
    expect(consoleErrors, "renderer console errors").toEqual([]);
  },
});

export { expect };
