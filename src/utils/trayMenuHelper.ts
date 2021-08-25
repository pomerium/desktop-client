import {
  app,
  BrowserWindow,
  clipboard,
  Menu,
  MenuItem,
  MenuItemConstructorOptions,
  nativeImage,
  shell,
  Tray,
} from 'electron';
import { Menubar } from 'menubar';
import path from 'path';
import { getAssetPath, menuIconPath } from './binaries';
import Connections from './connections';

type ConnectionOption = {
  label: string;
  click(): void;
  icon: nativeImage;
};

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
        const connectionOptions: ConnectionOption[] = [];

        if (connection.child) {
          connectionOptions.push({
            label: 'Disconnect',
            icon: nativeImage.createFromPath(
              path.join(menuIconPath, 'disconnect.png')
            ),
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
            icon: nativeImage.createFromPath(
              path.join(menuIconPath, 'connect.png')
            ),
            click: () => {
              this.connections.connect(connection.channelID, null);
              this.menu?.tray.setContextMenu(
                this.createContextMenu(this.connections)
              );
            },
          });
        }

        connectionOptions.push({
          label: 'Edit',
          icon: nativeImage.createFromPath(path.join(menuIconPath, 'edit.png')),
          click: () => {
            this.mainWindow?.webContents.send(
              'redirectTo',
              `/edit_connect/${connection.channelID}/${
                connection.child ? 'true' : 'false'
              }`
            );
            this.mainWindow?.show();
          },
        });

        connectionOptions.push({
          label: 'Copy Port',
          icon: nativeImage.createFromPath(
            path.join(menuIconPath, 'clipboard.png')
          ),
          click: () => {
            clipboard.writeText(connection.port);
          },
        });

        connectionOptions.push({
          label: 'Delete',
          icon: nativeImage.createFromPath(
            path.join(menuIconPath, 'delete.png')
          ),
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
        label: 'New Connection',
        icon: nativeImage.createFromPath(path.join(menuIconPath, 'add.png')),
        click() {
          mainWindow?.webContents.send('redirectTo', '/connect');
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
      icon: nativeImage.createFromPath(path.join(menuIconPath, 'help.png')),
      click() {
        shell.openExternal(
          'https://github.com/pomerium/pomerium-tcp-connector#readme'
        );
      },
    });

    template.push({
      label: 'Quit',
      icon: nativeImage.createFromPath(path.join(menuIconPath, 'quit.png')),
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
