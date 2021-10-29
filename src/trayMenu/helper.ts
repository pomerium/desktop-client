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
import { getAssetPath, menuIconPath } from '../main/binaries';
import ConnectionStatuses from '../main/connectionStatuses';

type ConnectionOption = {
  label: string;
  click(): void;
  icon: nativeImage;
};

export default class Helper {
  connections: ConnectionStatuses;

  appWindow: BrowserWindow | null;

  menu: Menubar | null;

  constructor(
    connections: ConnectionStatuses,
    appWindow: BrowserWindow | null,
    menu: Menubar | null
  ) {
    this.connections = connections;
    this.appWindow = appWindow;
    this.menu = menu;
  }

  setConnections = (connections: ConnectionStatuses) => {
    this.connections = connections;
  };

  setMenu = (menu: Menubar) => {
    this.menu = menu;
  };

  setAppWindow = (appWindow: BrowserWindow) => {
    this.appWindow = appWindow;
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
              this.connections.disconnect(connection.connectionID);
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
              this.connections.connect(connection.connectionID, null);
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
            this.appWindow?.webContents.send(
              'redirectTo',
              `/edit_connect/${connection.connectionID}/${
                connection.child ? 'true' : 'false'
              }`
            );
            this.appWindow?.show();
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
            this.connections.delete(connection.connectionID);
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
    const { appWindow, connections, buildConnections } = this;
    const template: (MenuItemConstructorOptions | MenuItem)[] = [
      {
        label: 'New Connection',
        icon: nativeImage.createFromPath(path.join(menuIconPath, 'add.png')),
        click() {
          appWindow?.webContents.send('redirectTo', '/connectForm');
          appWindow?.show();
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
        shell.openExternal('https://github.com/pomerium/desktop-client#readme');
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

  createContextMenu = (connections: ConnectionStatuses): Menu => {
    this.setConnections(connections);
    return Menu.buildFromTemplate(this.buildMenuTemplate());
  };

  createTray = (): Tray => {
    const tray = new Tray(getAssetPath('icons', '24x24.png'));
    tray.setContextMenu(this.createContextMenu(this.connections));
    return tray;
  };
}
