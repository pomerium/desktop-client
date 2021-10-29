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
  CONNECTION_SAVED,
  FolderActionData,
  CONNECT_ALL,
  DISCONNECT_ALL,
  DELETE_ALL,
  EXPORT_ALL,
  DELETE,
  EXPORT,
  DUPLICATE,
} from './shared/constants';
import Helper from './trayMenu/helper';
import ConnectionStatuses from './main/connectionStatuses';

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

  const connections = new ConnectionStatuses();
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
      connections.connect(args.connectionID, evt);
      menu.tray.setContextMenu(trayMenuHelper.createContextMenu(connections));
    });
    ipcMain.on(DISCONNECT, (_evt, msg) => {
      connections.disconnect(msg.connectionID);
      menu.tray.setContextMenu(trayMenuHelper.createContextMenu(connections));
    });
    ipcMain.on(DELETE, (_evt, args: ConnectionData) => {
      connections.delete(args.connectionID);
      menu.tray.setContextMenu(trayMenuHelper.createContextMenu(connections));
    });
    ipcMain.on(EXPORT, (_evt, args: ConnectionData) => {
      console.log(EXPORT + ' ' + args.connectionID + ' action was called.');
    });
    ipcMain.on(DUPLICATE, (_evt, args: ConnectionData) => {
      console.log(DUPLICATE + ' ' + args.connectionID + ' action was called.');
    });
    ipcMain.on(CONNECTION_SAVED, () => {
      connections.createMenuItems();
      menu.tray.setContextMenu(trayMenuHelper.createContextMenu(connections));
    });
    ipcMain.on(CONNECT_ALL, (_, args: FolderActionData) => {
      console.log(CONNECT_ALL + ' ' + args.folderName + ' action was called.');
    });
    ipcMain.on(DISCONNECT_ALL, (_, args: FolderActionData) => {
      console.log(
        DISCONNECT_ALL + ' ' + args.folderName + ' action was called.'
      );
    });
    ipcMain.on(DELETE_ALL, (_, args: FolderActionData) => {
      console.log(DELETE_ALL + ' ' + args.folderName + ' action was called.');
    });
    ipcMain.on(EXPORT_ALL, (_, args: FolderActionData) => {
      console.log(EXPORT_ALL + ' ' + args.folderName + ' action was called.');
    });

    app.on('before-quit', () => {
      Object.values(connections.getMenuConnections()).forEach((conn) => {
        connections.disconnect(conn.connectionID);
      });
      mainWindow?.removeAllListeners('close');
      mainWindow?.close();
    });
  });
});
