import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';

import electronBinary from 'electron';
import {
  _electron as electron,
  type ElectronApplication,
  type Page,
} from 'playwright-core';

const repoRoot = process.cwd();
const outputDir = path.join(repoRoot, 'output', 'playwright', 'electron-smoke');
const connectionName = 'Issue 497 Smoke';
const editedConnectionName = 'Issue 497 Smoke Edited';
const probePayload = 'issue-497-smoke-probe';

const logStep = (message: string) => {
  console.log(`[acceptance] ${message}`);
};

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

const getRoute = async (page: Page) => {
  return page.evaluate(() => window.location.hash);
};

const waitForRoute = async (
  page: Page,
  matcher: string | RegExp,
  timeout = 15000,
) => {
  await page.waitForFunction(
    ({ source, isRegex }) => {
      const { hash } = window.location;
      if (isRegex) {
        return new RegExp(source).test(hash);
      }
      return hash === source;
    },
    {
      source: matcher instanceof RegExp ? matcher.source : matcher,
      isRegex: matcher instanceof RegExp,
    },
    { timeout },
  );
};

const getAppWindow = async (electronApp: ElectronApplication) => {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const pages = electronApp.windows();
    logStep(`window scan ${attempt + 1}: found ${pages.length} window(s)`);

    for (const candidate of pages) {
      try {
        const bodyText = await candidate.evaluate(
          () => document.body?.innerText || '',
        );
        if (
          bodyText.includes('Manage Connections') ||
          bodyText.includes('Load Connections') ||
          bodyText.includes('Add Connection') ||
          bodyText.includes('Edit Connection')
        ) {
          return candidate;
        }
      } catch (_error) {
        // Ignore detached or not-yet-ready windows while the app initializes.
      }
    }

    await sleep(500);
  }

  throw new Error('failed to find the main application window');
};

const mkdir = async (target: string) => {
  await fs.mkdir(target, { recursive: true });
};

const findFreePort = async () => {
  return new Promise<number>((resolve, reject) => {
    const server = net.createServer();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        reject(new Error('failed to allocate free port'));
        return;
      }
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(address.port);
      });
    });
  });
};

const startEchoServer = async () => {
  const server = net.createServer((socket) => {
    socket.on('data', (chunk) => {
      socket.write(chunk);
    });
  });

  await new Promise<void>((resolve, reject) => {
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('failed to start echo server');
  }

  return {
    port: address.port,
    close: async () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      }),
  };
};

const expectListenerAcceptsConnection = async (port: number, payload: string) => {
  return new Promise<void>((resolve, reject) => {
    const socket = net.connect({ host: '127.0.0.1', port });
    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error(`timed out waiting for listener on ${port}`));
    }, 8000);

    let settled = false;
    let connected = false;

    const finish = (callback: () => void) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      callback();
    };

    socket.on('connect', () => {
      connected = true;
      socket.write(payload);
      setTimeout(() => {
        finish(() => {
          socket.destroy();
          resolve();
        });
      }, 250);
    });
    socket.on('data', () => {
      finish(() => {
        socket.destroy();
        resolve();
      });
    });
    socket.on('error', (error) => {
      if (connected && (error as NodeJS.ErrnoException).code === 'ECONNRESET') {
        finish(resolve);
        return;
      }
      finish(() => reject(error));
    });
    socket.on('close', () => {
      if (!settled && connected) {
        finish(resolve);
        return;
      }
      if (!settled) {
        finish(() =>
          reject(new Error(`listener ${port} closed before accepting a client`)),
        );
      }
    });
  });
};

const expectPortClosed = async (port: number) => {
  const lastErrors: string[] = [];

  for (let attempt = 0; attempt < 10; attempt += 1) {
    try {
      await new Promise<void>((resolve, reject) => {
        const socket = net.connect({ host: '127.0.0.1', port });
        const timer = setTimeout(() => {
          socket.destroy();
          reject(new Error('timed out waiting for closed port'));
        }, 1500);

        socket.on('connect', () => {
          clearTimeout(timer);
          socket.destroy();
          reject(new Error('port is still accepting connections'));
        });
        socket.on('error', () => {
          clearTimeout(timer);
          resolve();
        });
      });
      return;
    } catch (error) {
      lastErrors.push((error as Error).message);
      await sleep(500);
    }
  }

  throw new Error(
    `listener on ${port} stayed open after disconnect: ${lastErrors.join(' | ')}`,
  );
};

const saveScreenshot = async (page: Page, name: string) => {
  await page.screenshot({
    path: path.join(outputDir, `${name}.png`),
    fullPage: true,
  });
};

const getConnectionToggle = (page: Page, connectionLabel: string) => {
  return page
    .getByText(connectionLabel, { exact: true })
    .locator('xpath=ancestor::div[contains(@class, "MuiGrid-container")][1]')
    .getByRole('button')
    .first();
};

const installDownloadCapture = async (page: Page) => {
  const script = `
    (() => {
      const scope = window;

      if (scope.acceptanceDownloadCaptureInstalled) {
        return;
      }

      const originalCreateObjectURL = URL.createObjectURL.bind(URL);
      const originalAnchorClick = HTMLAnchorElement.prototype.click;

      scope.acceptanceDownloads = [];
      scope.acceptanceBlobUrls = new Map();

      URL.createObjectURL = (blob) => {
        const url = originalCreateObjectURL(blob);
        scope.acceptanceBlobUrls.set(url, blob);
        return url;
      };

      HTMLAnchorElement.prototype.click = function () {
        const filename = this.download;
        const blob = scope.acceptanceBlobUrls.get(this.href);

        if (filename && blob) {
          void blob.text().then((text) => {
            scope.acceptanceDownloads.push({ filename, text });
          });
          return;
        }

        return originalAnchorClick.call(this);
      };

      scope.acceptanceDownloadCaptureInstalled = true;
    })();
  `;

  // Playwright needs plain source here because tsx injects helper references into serialized functions.
  await page.evaluate((source) => {
    // eslint-disable-next-line no-eval
    window.eval(source);
  }, script);
};

async function main() {
  await fs.rm(outputDir, { recursive: true, force: true });
  await mkdir(outputDir);

  const echoServer = await startEchoServer();
  const localPort = await findFreePort();
  const tempHome = await fs.mkdtemp(
    path.join(os.tmpdir(), 'desktop-client-acceptance-'),
  );
  const tmpDir = path.join(tempHome, 'tmp');
  const appDataDir = path.join(tempHome, 'appData');
  const userDataDir = path.join(appDataDir, 'PomeriumDesktopIssue497Smoke');
  const exportPath = path.join(outputDir, 'connection-export.json');
  const summaryPath = path.join(outputDir, 'summary.json');

  await mkdir(tmpDir);
  await mkdir(appDataDir);
  await mkdir(userDataDir);

  logStep(`echo server listening on 127.0.0.1:${echoServer.port}`);
  logStep(`using local listener port 127.0.0.1:${localPort}`);

  let electronApp: ElectronApplication | undefined;
  let activePage: Page | undefined;

  try {
    logStep('launching Electron');
    electronApp = await electron.launch({
      executablePath: electronBinary,
      args: ['.'],
      cwd: repoRoot,
      env: {
        ...process.env,
        HOME: tempHome,
        TMPDIR: tmpDir,
        POMERIUM_DESKTOP_TEST_APP_NAME: 'PomeriumDesktopIssue497Smoke',
        POMERIUM_DESKTOP_TEST_APP_DATA_DIR: appDataDir,
        POMERIUM_DESKTOP_TEST_USER_DATA_DIR: userDataDir,
      },
    });
    logStep('Electron launch handshake complete');

    const page = await getAppWindow(electronApp);
    activePage = page;
    logStep('main application window located');
    await installDownloadCapture(page);

    page.on('pageerror', (error) => {
      console.error('[acceptance][pageerror]', error);
    });
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.error('[acceptance][console]', msg.text());
      }
    });

    logStep('waiting for initial connection list');
    await page.getByText('Manage Connections', { exact: true }).waitFor({
      state: 'visible',
      timeout: 30000,
    });
    logStep(`current route: ${await getRoute(page)}`);
    await saveScreenshot(page, '01-manage-connections');

    logStep('verifying the load connections flow renders');
    await page.getByRole('button', { name: 'New Connection' }).click();
    await page.getByText('Load Connections', { exact: true }).click();
    await page.getByText('Load Connections', { exact: true }).waitFor({
      state: 'visible',
    });
    await page.getByLabel('Pomerium URL').waitFor({ state: 'visible' });
    logStep(`current route: ${await getRoute(page)}`);
    await saveScreenshot(page, '02-load-connections');
    await page.getByRole('button', { name: 'Back' }).click();
    await waitForRoute(page, '#/manage');
    logStep(`current route: ${await getRoute(page)}`);

    logStep('creating a new connection');
    await page.getByRole('button', { name: 'New Connection' }).click();
    await page.getByText('Add Connecton', { exact: true }).click();
    await page.getByText('Add Connection', { exact: true }).waitFor({
      state: 'visible',
    });
    await page.getByLabel('Name').fill(connectionName);
    await page
      .getByLabel('Destination')
      .fill(`127.0.0.1:${echoServer.port}`);
    await page
      .getByLabel('Local Address')
      .fill(`127.0.0.1:${localPort}`);
    await saveScreenshot(page, '03-add-connection');
    await page.getByRole('button', { name: 'Save' }).click();
    await waitForRoute(page, /#\/view_connection\/.+/);
    await page.getByText(connectionName, { exact: true }).waitFor({
      state: 'visible',
    });
    logStep(`current route: ${await getRoute(page)}`);
    await saveScreenshot(page, '04-connection-view');

    logStep('connecting the tunnel and verifying traffic');
    await page.getByRole('button', { name: 'Connect' }).click();
    try {
      await page.getByRole('button', { name: 'Disconnect' }).waitFor({
        state: 'visible',
        timeout: 15000,
      });
    } catch (error) {
      const pageText = await page.evaluate(() => document.body?.innerText || '');
      console.error('[acceptance] connect step page text:');
      console.error(pageText);
      throw error;
    }
    await expectListenerAcceptsConnection(localPort, probePayload);
    await saveScreenshot(page, '05-connected');

    logStep('disconnecting the tunnel and verifying shutdown');
    await page.getByRole('button', { name: 'Disconnect' }).click();
    await page.getByRole('button', { name: 'Connect' }).waitFor({
      state: 'visible',
      timeout: 15000,
    });
    await expectPortClosed(localPort);

    logStep('editing the connection');
    await page.getByRole('button', { name: 'Edit' }).click();
    await waitForRoute(page, /#\/edit_connect\/.+/);
    await page.getByText('Edit Connection', { exact: true }).waitFor({
      state: 'visible',
    });
    await page.getByLabel('Name').fill(editedConnectionName);
    await page.getByRole('button', { name: 'Save' }).click();
    await waitForRoute(page, /#\/view_connection\/.+/);
    await page.getByText(editedConnectionName, { exact: true }).waitFor({
      state: 'visible',
    });
    await saveScreenshot(page, '06-edited');

    logStep('exporting the edited connection');
    await page.getByRole('button', { name: 'Export', exact: true }).click();
    await page
      .getByRole('dialog')
      .getByRole('heading', { name: 'Export', exact: true })
      .waitFor({
        state: 'visible',
      });
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Export' })
      .click();
    await page.waitForFunction(
      () =>
        ((window as typeof window & {
          acceptanceDownloads?: Array<{ filename: string; text: string }>;
        }).acceptanceDownloads?.length || 0) > 0,
      undefined,
      { timeout: 15000 },
    );
    const exportDownload = await page.evaluate(() => {
      const downloads = (window as typeof window & {
        acceptanceDownloads?: Array<{ filename: string; text: string }>;
      }).acceptanceDownloads;

      return downloads?.at(-1) || null;
    });
    assert.ok(exportDownload, 'expected export payload to be captured');
    await fs.writeFile(exportPath, exportDownload.text, 'utf8');
    const exportText = exportDownload.text;
    assert.match(exportText, new RegExp(editedConnectionName));
    assert.match(exportText, new RegExp(`127\\.0\\.0\\.1:${echoServer.port}`));

    logStep('deleting the connection');
    await page.getByRole('button', { name: 'Delete' }).click();
    await waitForRoute(page, '#/manage');
    await page
      .getByText(editedConnectionName, { exact: true })
      .waitFor({ state: 'detached', timeout: 15000 });
    logStep(`current route: ${await getRoute(page)}`);
    await saveScreenshot(page, '07-deleted');

    logStep('importing the exported connection');
    await electronApp.evaluate(({ dialog }, filePath) => {
      dialog.showOpenDialog = async () => ({
        canceled: false,
        filePaths: [filePath],
      });
    }, exportPath);
    await page.getByRole('button', { name: 'Import' }).click();
    await page.getByText('Uploaded Successfully', { exact: true }).waitFor({
      state: 'visible',
      timeout: 15000,
    });
    await page
      .getByRole('button', { name: 'toggle listeners for Untagged' })
      .click();
    await page.getByText(editedConnectionName, { exact: true }).waitFor({
      state: 'visible',
      timeout: 15000,
    });
    await saveScreenshot(page, '08-imported');

    logStep('reconnecting the imported connection from the list');
    await getConnectionToggle(page, editedConnectionName).click();
    await page
      .getByText(`Listening on 127.0.0.1:${localPort}`, { exact: true })
      .waitFor({
        state: 'visible',
        timeout: 15000,
      });
    await expectListenerAcceptsConnection(
      localPort,
      `${probePayload}-imported`,
    );
    await saveScreenshot(page, '09-imported-connected');

    logStep('disconnecting the imported connection');
    await getConnectionToggle(page, editedConnectionName).click();
    await page
      .getByText(`Listening on 127.0.0.1:${localPort}`, { exact: true })
      .waitFor({
        state: 'detached',
        timeout: 15000,
      });
    await expectPortClosed(localPort);

    await fs.writeFile(
      summaryPath,
      JSON.stringify(
        {
          remotePort: echoServer.port,
          localPort,
          exportPath,
          tempHome,
          userDataDir,
          completedAt: new Date().toISOString(),
        },
        null,
        2,
      ),
    );

    logStep(`acceptance run completed; summary written to ${summaryPath}`);
  } catch (error) {
    if (activePage) {
      await saveScreenshot(activePage, 'failure');
    }
    throw error;
  } finally {
    await echoServer.close();
    if (electronApp) {
      await electronApp.close();
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
