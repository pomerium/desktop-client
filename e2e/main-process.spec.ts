import { test, expect, shownDialogs, runFixme } from "./fixtures";
import { createConnection, findFreePort, startEchoServer } from "./helpers";

// Main process robustness. The fixtures already fail any test whose main
// process shows an error dialog; these tests set up the conditions for one.

test("the app keeps running when its stdout and stderr are closed", async ({
  electronApp,
  page,
}) => {
  // The main process logs every line of CLI output with console.info and
  // console.error (src/main/cli.ts). When the app was started from a terminal
  // or pipeline that has since gone away, those writes fail with EPIPE, which
  // reaches the uncaught exception handler: an "Error in Main process" dialog,
  // then the app quits (#637, see also #632).
  test.fixme(!runFixme, "https://github.com/pomerium/desktop-client/issues/637");
  const echo = await startEchoServer();
  try {
    const localPort = await findFreePort();
    await createConnection(page, {
      name: "E2E Closed Stdout",
      destination: `127.0.0.1:${echo.port}`,
      localAddress: `127.0.0.1:${localPort}`,
    });

    electronApp.process().stdout?.destroy();
    electronApp.process().stderr?.destroy();

    // Connecting and disconnecting make the CLI log, which the main process
    // writes out. In practice the crash comes on Disconnect.
    await page.getByRole("button", { name: "Connect", exact: true }).click();
    await expect(page.getByRole("button", { name: "Disconnect", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Disconnect", exact: true }).click();
    await expect(page.getByRole("button", { name: "Connect", exact: true })).toBeVisible();
    await page.waitForTimeout(1000);

    expect(await shownDialogs(electronApp)).toEqual([]);
    expect(await electronApp.evaluate(({ app }) => app.isReady())).toBe(true);
  } finally {
    await echo.close();
  }
});
