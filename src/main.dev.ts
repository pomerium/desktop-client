/* eslint global-require: off, no-console: off */
/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `yarn build` or `yarn build-main`, this file is compiled to
 * `./src/main.prod.js` using webpack. This gives us some performance wins.
 */
import * as grpc from '@grpc/grpc-js';
import * as Sentry from '@sentry/electron/main';
import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  MessageBoxOptions,
} from 'electron';
import contextMenu from 'electron-context-menu';
import log from 'electron-log';
import { autoUpdater } from 'electron-updater';
import fs from 'fs';
import { menubar } from 'menubar';
import path from 'path';
import * as url from 'url';

import { start } from './cli';
import createWindow from './renderer/window';
import {
  isDev,
  isProd,
  prodDebug,
  ConnectionData,
  DELETE_ALL,
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
  IMPORT,
  ExportFile,
  LISTENER_LOG,
  GET_ALL_RECORDS,
  FETCH_ROUTES,
  GetRecordsResponseArgs,
} from './shared/constants';
import {
  ConnectionStatusUpdate,
  ExportRequest,
  GetTagsRequest,
  ImportRequest,
  ListenerUpdateRequest,
  Record as ListenerRecord,
  Selector,
  StatusUpdatesRequest,
  FetchRoutesRequest,
} from './shared/pb/api';
import Helper from './trayMenu/helper';

const SentryDSN =
  'https://56e47edf5a3c437186196bb49bb03c4c@o845499.ingest.sentry.io/6146413';
Sentry.init({
  dsn: SentryDSN,
  debug: process.env.NODE_ENV !== 'production',
});

let mainWindow: BrowserWindow | null;
const singleInstanceLock = app.requestSingleInstanceLock();
let updateStream: grpc.ClientReadableStream<ConnectionStatusUpdate> | undefined;

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

const onUncaughtException = (() => {
  let shuttingDown = false;
  return async (err: Error) => {
    console.error(err);

    if (shuttingDown) {
      return;
    }
    shuttingDown = true;
    const sentryId = Sentry.captureException(err);

    const msg = {
      type: 'error',
      title: 'Error in Main process',
      message:
        'If you would like to file a bug report please include the following Sentry Id: ' +
        sentryId,
    } as MessageBoxOptions;

    if ('spawnargs' in err) {
      msg.title = 'Incorrect CLI supplied.';
      msg.message = 'Make sure the correct version for your OS is installed.';
    }
    // eslint-disable-next-line promise/no-promise-in-callback
    await Promise.all([Sentry.close(2000), dialog.showMessageBox(msg)]);

    app.quit();
  };
})();

process.on('uncaughtException', onUncaughtException);

app.on('activate', async () => {
  // On macOS, it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) mainWindow = createWindow();
});

async function init(): Promise<void> {
  const [cli] = await Promise.all([
    start(SentryDSN),
    new Promise((resolve) => app.on('ready', resolve)),
  ]);
  const cliProcess = cli.process;
  const { configClient, listenerClient } = cli;

  if (process.platform === 'win32') {
    // eslint-disable-next-line
    new AppUpdater();
  }

  mainWindow = createWindow();
  mainWindow?.loadURL(
    url.format({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file:',
      slashes: true,
    }),
  );

  const trayMenuHelper = new Helper([], {}, [], mainWindow, null);
  const tray = trayMenuHelper.createTray();
  const menu = menubar({
    preloadWindow: true,
    browserWindow: { width: 0, height: 0 },
    tray,
  });
  trayMenuHelper.setMenu(menu);
  menu.on('ready', async () => {
    menu.tray.on('click', () => {
      menu.tray.popUpContextMenu(trayMenuHelper.createContextMenu());
    });
    ipcMain.on(SAVE_RECORD, (evt, args: ListenerRecord) => {
      configClient.upsert(args, (err, res) => {
        evt?.sender.send(SAVE_RECORD, {
          err,
          res,
        });
        if (!err && res) {
          trayMenuHelper.setRecord(res);
          menu.tray.setContextMenu(trayMenuHelper.createContextMenu());
        }
      });
    });
    ipcMain.on(GET_RECORDS, (evt, selector: Selector) => {
      const sendTo = evt?.sender ? evt.sender : mainWindow?.webContents;
      configClient.list(selector, (err, res) => {
        const args: GetRecordsResponseArgs = { err, res };
        sendTo?.send(GET_RECORDS, args);
        if (!err && res) {
          if (selector.all) {
            trayMenuHelper.setRecords(res.records);
          } else {
            res.records.forEach((rec) => {
              trayMenuHelper.setRecord(rec);
            });
          }
          menu.tray.setContextMenu(trayMenuHelper.createContextMenu());
        }
      });
    });
    ipcMain.on(GET_ALL_RECORDS, (evt) => {
      const sendTo = evt?.sender ? evt.sender : mainWindow?.webContents;
      configClient.list(
        {
          all: true,
          ids: [],
          tags: [],
        } as Selector,
        (err, res) => {
          const args: GetRecordsResponseArgs = { err, res };
          sendTo?.send(GET_ALL_RECORDS, args);
          if (!err && res) {
            trayMenuHelper.setRecords(res.records);
            menu.tray.setContextMenu(trayMenuHelper.createContextMenu());
          }
        },
      );
    });
    ipcMain.on(GET_UNIQUE_TAGS, (evt) => {
      const sendTo = evt?.sender ? evt.sender : mainWindow?.webContents;
      configClient.getTags(GetTagsRequest, (err, res) => {
        sendTo?.send(GET_UNIQUE_TAGS, {
          err,
          tags: res?.tags || [],
        });
        if (!err && res) {
          trayMenuHelper.setTags(res.tags);
          menu.tray.setContextMenu(trayMenuHelper.createContextMenu());
        }
      });
    });
    ipcMain.on(DELETE, (evt, id: string) => {
      configClient.delete({ ids: [id], tags: [], all: false }, (err) => {
        evt?.sender.send(DELETE, {
          err,
        });
        if (!err) {
          ipcMain.emit(GET_ALL_RECORDS);
          ipcMain.emit(GET_UNIQUE_TAGS);
        }
      });
    });
    ipcMain.on(DELETE_ALL, (evt, tag: string) => {
      configClient.delete({ ids: [], tags: [tag], all: false }, (err) => {
        evt?.sender.send(DELETE, {
          err,
        });
        if (!err) {
          ipcMain.emit(GET_ALL_RECORDS);
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
    ipcMain.on(EXPORT, (evt, args: ExportFile) => {
      configClient.export(
        {
          selector: args.selector,
          removeTags: !args.includeTags,
          format: 2,
        } as ExportRequest,
        (err, res) => {
          evt?.sender?.send(EXPORT, {
            err,
            data: res?.data || [],
            filename: args.filename,
          });
        },
      );
    });
    ipcMain.on(IMPORT, (evt) => {
      dialog
        .showOpenDialog({ properties: ['openFile'] })
        .then((response) => {
          if (!response.canceled) {
            const bytes = fs.readFileSync(response.filePaths[0], null);
            configClient.import(
              {
                data: bytes as unknown as Uint8Array,
              } as ImportRequest,
              (err, res) => {
                evt?.sender?.send(IMPORT, { err, res });
              },
            );
          }
          return null;
        })
        .catch((err) => {
          Sentry.captureException(err);
          console.error(err);
        });
    });
    ipcMain.on(DUPLICATE, (_evt, args: ConnectionData) => {
      console.log(DUPLICATE + ' ' + args.connectionID + ' action was called.');
    });
    ipcMain.on(UPDATE_LISTENERS, (evt, args: ListenerUpdateRequest) => {
      const sendTo = evt?.sender ? evt.sender : mainWindow?.webContents;
      listenerClient.update(args, (err, res) => {
        sendTo?.send(LISTENER_STATUS, {
          err,
          res,
        });
        if (!err && res) {
          trayMenuHelper.setStatuses(res.listeners);
          menu.tray.setContextMenu(trayMenuHelper.createContextMenu());
        }
      });
    });
    ipcMain.on(LISTENER_STATUS, (evt, args: Selector) => {
      const sendTo = evt?.sender ? evt.sender : mainWindow?.webContents;
      listenerClient.getStatus(args, (err, res) => {
        sendTo?.send(LISTENER_STATUS, {
          err,
          res,
        });
        if (!err && res) {
          trayMenuHelper.setStatuses(res.listeners);
          menu.tray.setContextMenu(trayMenuHelper.createContextMenu());
        }
      });
    });
    ipcMain.on(LISTENER_LOG, (evt, args) => {
      const sendTo = evt?.sender ? evt.sender : mainWindow?.webContents;
      updateStream?.cancel();
      updateStream = listenerClient.statusUpdates({
        connectionId: args.id as string,
      } as StatusUpdatesRequest);
      updateStream.on('data', (response) => {
        sendTo?.send(LISTENER_LOG, {
          msg: response as ConnectionStatusUpdate,
          remoteAddr: args.remoteAddr,
        });
      });
      // empty function otherwise causes fatal error on cancel !!!
      updateStream.on('error', () => {});
    });
    ipcMain.on(FETCH_ROUTES, (evt, args) => {
      const sendTo = evt?.sender ? evt.sender : mainWindow?.webContents;
      configClient.fetchRoutes(args as FetchRoutesRequest, (err, res) => {
        sendTo?.send(FETCH_ROUTES, { err, res });
      });
    });
    menu.app.on('web-contents-created', () => {
      contextMenu();
    });
    app.on('before-quit', () => {
      mainWindow?.removeAllListeners('close');
      updateStream?.cancel();
      cliProcess.kill('SIGINT');
      mainWindow?.close();
    });

    // Auto-start connections marked with autostart flag
    configClient.list({ all: true, ids: [], tags: [] }, (err, res) => {
      if (!err && res) {
        const autoStartIds = res.records
          .filter((r) => r.conn && r.conn.autostart)
          .map((r) => r.id);
        if (autoStartIds.length > 0) {
          listenerClient.update(
            { connectionIds: autoStartIds, connected: true },
            (updateErr, updateRes) => {
              if (!updateErr && updateRes) {
                trayMenuHelper.setStatuses(updateRes.listeners);
                menu.tray.setContextMenu(trayMenuHelper.createContextMenu());
                console.log('Auto-started connections:', autoStartIds);
              }
            },
          );
        }
      }
    });
  });
}

if (!singleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
  init();
}
