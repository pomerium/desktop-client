import {
  BrowserWindow,
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
import { CONNECT_ALL, DISCONNECT, DISCONNECT_ALL } from '../shared/constants';
import { Record } from '../shared/pb/api';

export default class Helper {
  records: Record[];

  tags: string[];

  appWindow: BrowserWindow | null;

  menu: Menubar | null;

  constructor(
    records: Record[],
    tags: string[],
    appWindow: BrowserWindow | null,
    menu: Menubar | null
  ) {
    this.records = records;
    this.appWindow = appWindow;
    this.menu = menu;
    this.tags = tags;
  }

  setMenu = (menu: Menubar) => {
    this.menu = menu;
  };

  setAppWindow = (appWindow: BrowserWindow) => {
    this.appWindow = appWindow;
  };

  updateTags = (tags: string[]) => {
    this.tags = tags;
  };

  updateRecords = (records: Record[]) => {
    this.records = records;
  };

  updateRecord = (record: Record) => {
    const index = this.records.findIndex((rec) => rec.id === record.id);
    if (index > -1) {
      this.records[index] = record;
    } else {
      this.records.push(record);
    }
  };

  buildFolderSubmenu = (
    folderName: string,
    filtered: Record[]
  ): MenuItemConstructorOptions[] => {
    const connectionItems: MenuItemConstructorOptions[] = [];

    connectionItems.push({
      label: 'Connect All',
      click() {
        ipcMain.emit(CONNECT_ALL, {}, folderName);
      },
    });

    connectionItems.push({
      label: 'Disconnect All',
      click() {
        ipcMain.emit(DISCONNECT_ALL, {}, folderName);
      },
    });

    connectionItems.push({
      type: 'separator',
    });

    filtered.forEach((rec) => {
      connectionItems.push({
        label: rec?.conn?.name as string,
        icon: nativeImage.createFromPath(
          path.join(menuIconPath, 'connected.png')
        ),
        click() {
          ipcMain.emit(DISCONNECT, {}, { connectionID: rec.id });
        },
      });
    });
    return connectionItems;
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

    this.tags.forEach((tag) => {
      const conns = this.buildFolderSubmenu(
        tag,
        this.records.filter((rec) => rec.tags.includes(tag))
      );

      template.push({
        label: tag,
        icon: nativeImage.createFromPath(path.join(menuIconPath, 'folder.png')),
        submenu: conns,
      });
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

  createContextMenu = (): Menu => {
    return Menu.buildFromTemplate(this.buildMenuTemplate());
  };

  createTray = (): Tray => {
    const tray = new Tray(getAssetPath('icons', '24x24.png'));
    tray.setContextMenu(this.createContextMenu());
    return tray;
  };
}
