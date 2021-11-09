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
import { app, BrowserWindow, dialog, globalShortcut, ipcMain } from 'electron';
import installExtension, { REDUX_DEVTOOLS } from 'electron-devtools-installer';
import * as grpc from '@grpc/grpc-js';
import log from 'electron-log';
import { autoUpdater } from 'electron-updater';
import { menubar } from 'menubar';
import * as url from 'url';
import path from 'path';
import createWindow from './renderer/window';
import 'regenerator-runtime/runtime';
import {
  isDev,
  isProd,
  prodDebug,
  ConnectionData,
  CONNECTION_SAVED,
  DELETE_ALL,
  EXPORT_ALL,
  DELETE,
  EXPORT,
  DUPLICATE,
  VIEW,
  EDIT,
  VIEW_CONNECTION_LIST,
  SAVE_RECORD,
  GET_RECORDS,
  GET_UNIQUE_TAGS,
  UPDATE_LISTENERS,
  LISTENER_STATUS,
} from './shared/constants';
import Helper from './trayMenu/helper';
import ConnectionStatuses from './main/connectionStatuses';
import {
  ConfigClient,
  GetTagsRequest,
  ListenerClient,
  ListenerUpdateRequest,
  Record,
  Selector,
} from './shared/pb/api';

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

const configClient = new ConfigClient(
  '127.0.0.1:8800',
  grpc.ChannelCredentials.createInsecure()
);

const listenerClient = new ListenerClient(
  '127.0.0.1:8800',
  grpc.ChannelCredentials.createInsecure()
);

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
    globalShortcut.register('CommandOrControl+M', () => {
      mainWindow?.webContents.send('redirectTo', '/manage');
      mainWindow?.show();
    });
    menu.tray.on('click', () => {
      menu.tray.popUpContextMenu(trayMenuHelper.createContextMenu(connections));
    });
    ipcMain.on(SAVE_RECORD, (evt, args: Record) => {
      configClient.upsert(args, (err, res) => {
        evt?.sender.send(SAVE_RECORD, {
          err,
          res,
        });
      });
    });
    ipcMain.on(GET_RECORDS, (evt, selector: Selector) => {
      const sendTo = evt?.sender ? evt.sender : mainWindow?.webContents;
      configClient.list(selector, (err, res) => {
        sendTo?.send(GET_RECORDS, {
          err,
          res,
        });
      });
    });
    ipcMain.on(GET_UNIQUE_TAGS, (evt) => {
      const sendTo = evt?.sender ? evt.sender : mainWindow?.webContents;
      configClient.getTags(GetTagsRequest, (err, res) => {
        sendTo?.send(GET_UNIQUE_TAGS, {
          err,
          tags: res?.tags || [],
        });
      });
    });
    ipcMain.on(DELETE, (evt, id: string) => {
      configClient.delete({ ids: [id], tags: [], all: false }, (err) => {
        evt?.sender.send(DELETE, {
          err,
        });
        if (!err) {
          ipcMain.emit(GET_RECORDS, {}, {
            all: true,
            ids: [],
            tags: [],
          } as Selector);
          ipcMain.emit(GET_UNIQUE_TAGS);
        }
      });
      menu.tray.setContextMenu(trayMenuHelper.createContextMenu(connections));
    });
    ipcMain.on(DELETE_ALL, (evt, tag: string) => {
      configClient.delete({ ids: [], tags: [tag], all: false }, (err) => {
        evt?.sender.send(DELETE, {
          err,
        });
        if (!err) {
          ipcMain.emit(GET_RECORDS, {}, {
            all: true,
            ids: [],
            tags: [],
          } as Selector);
          ipcMain.emit(GET_UNIQUE_TAGS);
        }
      });
    });
    ipcMain.on(EDIT, (_evt, id: string) => {
      mainWindow?.webContents.send('redirectTo', `/edit_connect/${id}`);
    });
    ipcMain.on(VIEW, (_evt, id: string) => {
      mainWindow?.webContents.send('redirectTo', `/view_connection/${id}`);
    });
    ipcMain.on(VIEW_CONNECTION_LIST, () => {
      mainWindow?.webContents.send('redirectTo', `/manage`);
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
    ipcMain.on(UPDATE_LISTENERS, (evt, args: ListenerUpdateRequest) => {
      listenerClient.update(args, (err, res) => {
        evt?.sender.send(LISTENER_STATUS, {
          err,
          res,
        });
      });
    });
    ipcMain.on(LISTENER_STATUS, (evt, args: Selector) => {
      listenerClient.getStatus(args, (err, res) => {
        evt?.sender.send(LISTENER_STATUS, {
          err,
          res,
        });
      });
    });
    ipcMain.on(EXPORT_ALL, (_, tag: string) => {
      console.log(EXPORT_ALL + ' ' + tag + ' action was called.');
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
