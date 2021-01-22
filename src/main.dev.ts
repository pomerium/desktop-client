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
import { app, BrowserWindow, ipcMain } from 'electron';
import installExtension, { REDUX_DEVTOOLS } from 'electron-devtools-installer';
import log from 'electron-log';
import { autoUpdater } from 'electron-updater';
import { menubar } from 'menubar';
import Store from 'electron-store';
import createWindow from './utils/mainWindow';
import 'regenerator-runtime/runtime';
import { spawnTcpConnect, ConnectionData } from './utils/binaries';
import {
  CONNECTION_CLOSED,
  CONNECTION_RESPONSE,
  DISCONNECT,
  isDev,
  isProd,
  prodDebug,
} from './utils/constants';
import { createTray, createContextMenu, Connection } from './utils/trayMenu';

let connections: Connection[] = [];
let mainWindow: BrowserWindow | null;

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

const getPort = (text: string) => {
  const parts = text.split(':');
  return parseInt(parts[parts.length - 1], 10);
};

if (isProd) {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (isDev || prodDebug) {
  require('electron-debug')();
}

app.on('activate', async () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) mainWindow = createWindow();
});

app.on('before-quit', () => {
  connections.forEach((connection) => connection.child.kill());
  mainWindow?.removeAllListeners('close');
  mainWindow?.close();
});

app.on('ready', async () => {
  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
  installExtension(REDUX_DEVTOOLS)
    .then((name: string) => console.log(`Added Extension:  ${name}`))
    .catch((err: Error) => console.log('An error occurred: ', err));
  mainWindow = createWindow();
  mainWindow?.loadURL(`file://${__dirname}/index.html`);
  const tray = createTray(mainWindow);
  const mb = menubar({
    tray,
  });

  mb.on('ready', async () => {
    const store = new Store();
    store.onDidChange('connections', (conns) => {
      console.log(conns);
    });
    ipcMain.on('connect', (event, args: ConnectionData) => {
      const child = spawnTcpConnect(args);
      child.stderr.setEncoding('utf8');
      const output: string[] = [];
      child.stderr.on('data', (data) => {
        output.push(data.toString());
        event.sender.send(CONNECTION_RESPONSE, {
          output,
          channelID: args.channelID,
        });
        const port = `:${getPort(data.toString())}`;
        const connectionExists = connections.some(
          (connection) => connection.channelID === args.channelID
        );
        if (!connectionExists) {
          connections.push({
            url: args.destinationUrl,
            port,
            child,
            channelID: args.channelID,
          });
          mb.tray.setContextMenu(createContextMenu(mainWindow, connections));
        }
      });
      ipcMain.on(DISCONNECT, (_, msg) => {
        if (msg.channelID === args.channelID) {
          child.kill();
        }
      });
      child.on('exit', (code) => {
        event.sender.send(CONNECTION_CLOSED, {
          code,
          channelID: args.channelID,
        });
        child.removeAllListeners();
        connections = connections.filter((connection) => {
          return connection.channelID !== args.channelID;
        });
        mb.tray.setContextMenu(createContextMenu(mainWindow, connections));
      });
    });
  });
});
