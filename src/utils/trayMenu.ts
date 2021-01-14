import {
  app,
  BrowserWindow,
  Menu,
  MenuItem,
  MenuItemConstructorOptions,
  shell,
  Tray,
} from 'electron';
import child_process from 'child_process';
import { getAssetPath } from './binaries';

export interface Connection {
  url: string;
  port: string;
  child: child_process.ChildProcessWithoutNullStreams;
  channelID: string;
}

const buildConnections = (connections: Connection[]) => {
  return connections.map((connection) => {
    return {
      label: `${connection.url} -> ${connection.port}`,
      submenu: [
        {
          label: 'Disconnect',
          click: () => {
            connection.child.kill();
          },
        },
      ],
    };
  });
};

const buildMenuTemplate = (
  mainWindow: BrowserWindow | null,
  connections: Connection[]
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
  if (connections.length) {
    template.push({
      label: 'Connections',
      submenu: buildConnections(connections),
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
  connections: Connection[]
): Menu => {
  return Menu.buildFromTemplate(buildMenuTemplate(mainWindow, connections));
};

export const createTray = (mainWindow: BrowserWindow): Tray => {
  const tray = new Tray(getAssetPath('icons', '24x24.png'));
  tray.setContextMenu(createContextMenu(mainWindow, []));
  return tray;
};
