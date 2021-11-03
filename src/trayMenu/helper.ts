import {
  BrowserWindow,
  clipboard,
  ipcMain,
  Menu,
  MenuItem,
  MenuItemConstructorOptions,
  nativeImage,
  Tray,
} from 'electron';
import { Menubar } from 'menubar';
import path from 'path';
import { getAssetPath, menuIconPath } from '../main/binaries';
import ConnectionStatuses from '../main/connectionStatuses';
import {
  CONNECT,
  CONNECT_ALL,
  DISCONNECT,
  DISCONNECT_ALL,
} from '../shared/constants';

type ConnectionOption = {
  label: string;
  click(): void;
  icon?: nativeImage;
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
    const { appWindow } = this;
    const template: (MenuItemConstructorOptions | MenuItem)[] = [];
    template.push({
      label: 'Connections',
      icon: nativeImage.createFromPath(path.join(menuIconPath, 'add.png')),
      click() {
        appWindow?.webContents.send('redirectTo', '/connectForm');
        appWindow?.show();
      },
    });

    const connectionItems: MenuItemConstructorOptions[] = [];

    connectionItems.push({
      label: 'Connect All',
      click() {
        ipcMain.emit(CONNECT_ALL, {}, { folderName: 'All Connections' });
      },
    });

    connectionItems.push({
      label: 'Disconnect All',
      click() {
        ipcMain.emit(DISCONNECT_ALL, {}, { folderName: 'All Connections' });
      },
    });

    connectionItems.push({
      type: 'separator',
    });

    connectionItems.push({
      label: 'Connection 1',
      icon: nativeImage.createFromPath(
        path.join(menuIconPath, 'connected.png')
      ),
      click() {
        ipcMain.emit(DISCONNECT, {}, { connectionID: 'test' });
      },
    });

    connectionItems.push({
      label: 'Connection 2',
      icon: nativeImage.createFromPath(
        path.join(menuIconPath, 'disconnected.png')
      ),
      click() {
        ipcMain.emit(CONNECT, {}, { connectionID: 'test' });
      },
    });

    template.push({
      label: 'All Connections',
      icon: nativeImage.createFromPath(path.join(menuIconPath, 'folder.png')),
      submenu: connectionItems,
    });

    template.push({
      label: 'Manage Connections',
      accelerator: 'CommandOrControl+M',
      click() {
        appWindow?.webContents.send('redirectTo', '/manage');
        appWindow?.show();
      },
    });

    template.push({
      type: 'separator',
    });

    template.push({
      label: 'Quit',
      role: 'quit',
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
