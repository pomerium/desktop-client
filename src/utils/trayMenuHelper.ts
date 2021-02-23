import {
  app,
  BrowserWindow,
  Menu,
  MenuItem,
  MenuItemConstructorOptions,
  shell,
  Tray,
} from 'electron';
import { getAssetPath } from './binaries';
import Connections from './connections';
import { MENU_CHANGE } from './constants';

const buildConnections = (
  connections: Connections,
  mainWindow: BrowserWindow | null
) => {
  return Object.values(connections.getMenuConnections()).map((connection) => {
    const connectionOptions = [];
    if (connection.child) {
      connectionOptions.push({
        label: 'Disconnect',
        click: () => {
          connections.disconnect(connection.channelID);
          mainWindow?.webContents.send(MENU_CHANGE, {});
        },
      });
    } else {
      connectionOptions.push({
        label: 'Connect',
        click: () => {
          connections.connect(connection.channelID, null);
          console.log(mainWindow);
          mainWindow?.webContents.send(MENU_CHANGE, {});
        },
      });
    }
    return {
      label: `${connection.url} -> `,
      sublabel: connection.port,
      submenu: connectionOptions,
    };
  });
};

const buildMenuTemplate = (
  mainWindow: BrowserWindow | null,
  connections: Connections
) => {
  const template: (MenuItemConstructorOptions | MenuItem)[] = [
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
  ];
  if (Object.values(connections.getMenuConnections()).length) {
    template.push({
      label: 'Connections',
      submenu: buildConnections(connections, mainWindow),
    });
  }

  template.push({
    label: 'Help',
    click() {
      shell.openExternal(
        'https://github.com/pomerium/pomerium-tcp-connector#readme'
      );
    },
  });

  template.push({
    label: 'Quit',
    click() {
      app.quit();
    },
  });

  return template;
};

export const createContextMenu = (
  mainWindow: BrowserWindow | null,
  connections: Connections
): Menu => {
  return Menu.buildFromTemplate(buildMenuTemplate(mainWindow, connections));
};

export const createTray = (
  mainWindow: BrowserWindow,
  connections: Connections
): Tray => {
  const tray = new Tray(getAssetPath('icons', '24x24.png'));
  tray.setContextMenu(createContextMenu(mainWindow, connections));
  return tray;
};
