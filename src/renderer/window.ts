import { BrowserWindow } from 'electron';
import { getAssetPath } from '../main/binaries';
import MenuBuilder from './menu';

const createWindow = () => {
  const appWindow = new BrowserWindow({
    show: false,
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
