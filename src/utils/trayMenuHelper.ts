import {
  app,
  BrowserWindow,
  Menu,
  MenuItem,
  MenuItemConstructorOptions,
  shell,
  Tray,
} from 'electron';
import { Menubar } from 'menubar';
import { getAssetPath } from './binaries';
import Connections from './connections';

export default class TrayMenuHelper {
  connections: Connections;

  mainWindow: BrowserWindow | null;

  menu: Menubar | null;

  constructor(
    connections: Connections,
    mainWindow: BrowserWindow | null,
    menu: Menubar | null
  ) {
    this.connections = connections;
    this.mainWindow = mainWindow;
    this.menu = menu;
  }

  setConnections = (connections: Connections) => {
    this.connections = connections;
  };

  setMenu = (menu: Menubar) => {
    this.menu = menu;
  };

  setMainWindow = (mainWindow: BrowserWindow) => {
    this.mainWindow = mainWindow;
  };

  buildConnections = () => {
    return Object.values(this.connections.getMenuConnections()).map(
      (connection) => {
        const connectionOptions = [];
        if (connection.child) {
          connectionOptions.push({
            label: 'Disconnect',
            click: () => {
              this.connections.disconnect(connection.channelID);
              this.menu?.tray.setContextMenu(
                this.createContextMenu(this.connections)
              );
            },
          });
        } else {
          connectionOptions.push({
            label: 'Connect',
            click: () => {
              this.connections.connect(connection.channelID, null);
              this.menu?.tray.setContextMenu(
                this.createContextMenu(this.connections)
              );
            },
          });
        }
        connectionOptions.push({
          label: 'Delete',
          click: () => {
            this.connections.deleteConnection(connection.channelID);
            this.menu?.tray.setContextMenu(
              this.createContextMenu(this.connections)
            );
          },
        });
        return {
          label: `${connection.url} -> ${connection.port}`,
          submenu: connectionOptions,
        };
      }
    );
  };

  buildMenuTemplate = () => {
    const { mainWindow, connections, buildConnections } = this;
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
        submenu: buildConnections(),
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

  createContextMenu = (connections: Connections): Menu => {
    this.setConnections(connections);
    return Menu.buildFromTemplate(this.buildMenuTemplate());
  };

  createTray = (): Tray => {
    const tray = new Tray(getAssetPath('icons', '24x24.png'));
    tray.setContextMenu(this.createContextMenu(this.connections));
    return tray;
  };
}
