import { BrowserWindow } from 'electron';
import { join } from 'path';

import { getAssetPath } from './binaries';
import MenuBuilder from './menu';

const createWindow = (): BrowserWindow | null => {
  const appWindow = new BrowserWindow({
    show: true,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      preload: join(__dirname, '../preload/index.js'),
    },
  });

  appWindow.webContents.on('did-finish-load', () => {
    if (!appWindow) {
      throw new Error('"mainWindow" is not defined');
    }
  });

  appWindow.on('minimize', (event: Event) => {
    event.preventDefault();
    appWindow?.hide();
  });

  appWindow.on('close', (event) => {
    event.preventDefault();
    appWindow?.hide();
    return false;
  });

  const menuBuilder = new MenuBuilder(appWindow);
  menuBuilder.buildMenu();

  return appWindow;
};

export default createWindow;
