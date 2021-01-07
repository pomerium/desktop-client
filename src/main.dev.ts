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
import { app, BrowserWindow } from 'electron';
import { menubar } from 'menubar';
import 'regenerator-runtime/runtime';
import installExtension, { REDUX_DEVTOOLS } from 'electron-devtools-installer';
import log from 'electron-log';
import { autoUpdater } from 'electron-updater';
import { pomeriumCli } from './utils/binaries';
import { isDev, isProd, prodDebug } from './utils/constants';
import createWindow from './utils/mainWindow';
import createTray from './utils/trayMenu';

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
let mainWindow: BrowserWindow | null;

app.on('activate', async () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) mainWindow = createWindow();
});

app.on('before-quit', () => {
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

  mb.on('ready', async () => {});
});

// poc to make sure it works
const command = `${pomeriumCli} -h`;
child_process.exec(command, (error, standard_out, standard_error) => {
  console.log(error);
  console.log(standard_out);
  console.log(standard_error);
});
