/* eslint global-require: off, no-console: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `yarn build` or `yarn build-main`, this file is compiled to
 * `./src/main.prod.js` using webpack. This gives us some performance wins.
 */
import * as child_process from 'child_process';
import 'core-js/stable';
import { app, BrowserWindow, Tray, Menu, shell } from 'electron';
import log from 'electron-log';
import { autoUpdater } from 'electron-updater';
import 'regenerator-runtime/runtime';
import { menubar } from 'menubar';
import { getAssetPath, pomeriumCli } from './binaries';

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (
  process.env.NODE_ENV === 'development' ||
  process.env.DEBUG_PROD === 'true'
) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.DEBUG_PROD === 'true'
  ) {
    await installExtensions();
  }

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      nodeIntegration: true,
    },
  });

  // @TODO: Use 'ready-to-show' event
  //        https://gitpomerium-tcp-connector/src/main.dev.ts:83hub.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }

    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  mainWindow.on('minimize', (event: Event) => {
    event.preventDefault();
    mainWindow?.hide();
  });

  mainWindow.on('close', (event) => {
    event.preventDefault();
    mainWindow?.hide();
    return false;
  });
  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

app.on('activate', async () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) await createWindow();
});

app.on('before-quit', () => {
  mainWindow?.removeAllListeners('close');
  mainWindow?.close();
});

app.on('ready', async () => {
  await createWindow();
  const tray = new Tray(getAssetPath('icons', '24x24.png'));
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Docs',
      click() {
        shell.openExternal(
          'https://github.com/pomerium/pomerium-tcp-connector#readme'
        );
      },
    },
    {
      label: 'Connect',
      click() {
        mainWindow?.loadURL(`file://${__dirname}/index.html`);
        mainWindow?.show();
      },
    },
    { label: 'Item2', type: 'radio' },
    { label: 'Item3', type: 'radio', checked: true },
    {
      label: 'Quit',
      click() {
        app.quit();
      },
    },
  ]);
  tray.setContextMenu(contextMenu);

  const mb = menubar({
    tray,
  });

  mb.on('ready', async () => {});
});

// poc to make sure it works
const command = `${pomeriumCli} -h`;
child_process.exec(command, (error, standard_out, standard_error) => {
  console.log(error);
  console.log(standard_out);
  console.log(standard_error);
});
