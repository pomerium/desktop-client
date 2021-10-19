/* eslint global-require: off, no-console: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `yarn build` or `yarn build-main`, this file is compiled to
 * `./src/main.prod.js` using webpack. This gives us some performance wins.
 */
import 'core-js/stable';
import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import installExtension, { REDUX_DEVTOOLS } from 'electron-devtools-installer';
import log from 'electron-log';
import { autoUpdater } from 'electron-updater';
import { menubar } from 'menubar';
import * as url from 'url';
import path from 'path';
import createWindow from './renderer/window';
import 'regenerator-runtime/runtime';
import {
  DISCONNECT,
  isDev,
  isProd,
  prodDebug,
  ConnectionData,
  CONNECT,
  SAVE_CONNECTION,
} from './shared/constants';
import Connections from './main/connections';
import Helper from './trayMenu/helper';

let mainWindow: BrowserWindow | null;

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

if (isProd) {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (isDev || prodDebug) {
  require('electron-debug')();
}

process.on('uncaughtException', (err) => {
  const msg = {
    type: 'error',
    title: 'Error in Main process',
    message:
      'Something went wrong. Contact your administrator or Pomerium representative.',
  } as Electron.MessageBoxSyncOptions;

  if ('spawnargs' in err) {
    msg.title = 'Incorrect CLI supplied.';
    msg.message = 'Make sure the correct version for your OS is installed.';
  }
  console.log(err);
  dialog.showMessageBoxSync(msg);
  app.exit(1);
});

app.on('activate', async () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) mainWindow = createWindow();
});

app.on('ready', async () => {
  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
  installExtension(REDUX_DEVTOOLS)
    .then((name: string) => console.log(`Added Extension:  ${name}`))
    .catch((err: Error) => console.log('An error occurred: ', err));
  mainWindow = createWindow();
  mainWindow?.loadURL(
    url.format({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file:',
      slashes: true,
    })
  );
  const connections = new Connections();
  const trayMenuHelper = new Helper(connections, mainWindow, null);
  const tray = trayMenuHelper.createTray();
  const menu = menubar({
    preloadWindow: true,
    browserWindow: { width: 0, height: 0 },
    tray,
  });
  trayMenuHelper.setMenu(menu);
  menu.on('ready', async () => {
    menu.tray.on('click', () => {
      menu.tray.popUpContextMenu(trayMenuHelper.createContextMenu(connections));
    });
    ipcMain.on(CONNECT, (evt, args: ConnectionData) => {
      connections.connect(args.channelID, evt);
      menu.tray.setContextMenu(trayMenuHelper.createContextMenu(connections));
    });
    ipcMain.on(DISCONNECT, (_evt, msg) => {
      connections.disconnect(msg.channelID);
      menu.tray.setContextMenu(trayMenuHelper.createContextMenu(connections));
    });
    ipcMain.on(SAVE_CONNECTION, (evt, args: ConnectionData) => {
      console.log(args);
      connections.saveConnection(args, evt);
      connections.createMenuConnectionFromData(args);
    });
    app.on('before-quit', () => {
      Object.values(connections.getMenuConnections()).forEach((conn) => {
        connections.disconnect(conn.channelID);
      });
      mainWindow?.removeAllListeners('close');
      mainWindow?.close();
    });
  });
});
