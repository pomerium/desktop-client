import { app, BrowserWindow, Menu, shell, Tray } from 'electron';
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

export const createContextMenu = (
  mainWindow: BrowserWindow | null,
  connections: Connection[]
): Menu => {
  return Menu.buildFromTemplate([
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
      label: 'Connections',
      submenu: buildConnections(connections),
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
};

export const createTray = (mainWindow: BrowserWindow): Tray => {
  const tray = new Tray(getAssetPath('icons', '24x24.png'));
  tray.setContextMenu(createContextMenu(mainWindow, []));
  return tray;
};
