import { BrowserWindow } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import { getAssetPath } from './binaries';
import MenuBuilder from './windowMenu';

export class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

export const createWindow = () => {
  const mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      nodeIntegration: true,
    },
  });

  mainWindow.loadURL(`file://${__dirname}/../index.html`);

  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
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

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();

  return mainWindow;
};
