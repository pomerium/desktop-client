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
import { app, Tray, Menu, shell, BrowserWindow } from 'electron';
import { menubar } from 'menubar';
import 'regenerator-runtime/runtime';
import installExtension, { REDUX_DEVTOOLS } from 'electron-devtools-installer';
import { getAssetPath, pomeriumCli } from './utils/binaries';
import { isDev, isProd, prodDebug } from './utils/constants';
import { createWindow } from './utils/MainWindow';

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
  installExtension(REDUX_DEVTOOLS)
    .then((name: string) => console.log(`Added Extension:  ${name}`))
    .catch((err: Error) => console.log('An error occurred: ', err));
  mainWindow = createWindow();
  const tray = new Tray(getAssetPath('icons', '24x24.png'));
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Connect',
      click() {
        mainWindow?.webContents.send('redirectTo', '/hello');
        mainWindow?.show();
      },
    },
    {
      label: 'Settings',
      click() {
        mainWindow?.webContents.send('redirectTo', '/hello2');
        mainWindow?.show();
      },
    },
    {
      label: 'Help',
      click() {
        shell.openExternal(
          'https://github.com/pomerium/pomerium-tcp-connector#readme'
        );
      },
    },
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
