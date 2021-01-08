import { app, BrowserWindow, Menu, shell, Tray } from 'electron';
import { getAssetPath } from './binaries';

const createTray = (mainWindow: BrowserWindow): Tray => {
  const tray = new Tray(getAssetPath('icons', '24x24.png'));
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Connect',
      click() {
        mainWindow?.webContents.send('redirectTo', '/connect');
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
  return tray;
};

export default createTray;
