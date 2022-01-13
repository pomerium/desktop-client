import * as Sentry from '@sentry/electron';
import { BrowserWindow } from 'electron';
import { getAssetPath } from '../main/binaries';
import MenuBuilder from './menu';

Sentry.init({
  dsn: 'https://56e47edf5a3c437186196bb49bb03c4c@o845499.ingest.sentry.io/6146413',
});

const createWindow = () => {
  const appWindow = new BrowserWindow({
    show: true,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      nodeIntegration: true,
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
