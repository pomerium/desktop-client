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
import { UPDATE_LISTENERS } from '../shared/constants';
import { ListenerStatus, Record } from '../shared/pb/api';

export default class Helper {
  records: Record[];

  statuses: { [key: string]: ListenerStatus };

  tags: string[];

  appWindow: BrowserWindow | null;

  menu: Menubar | null;

  constructor(
    records: Record[],
    statuses: { [key: string]: ListenerStatus },
    tags: string[],
    appWindow: BrowserWindow | null,
    menu: Menubar | null
  ) {
    this.records = records;
    this.statuses = statuses;
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

  setTags = (tags: string[]) => {
    this.tags = tags;
  };

  setRecords = (records: Record[]) => {
    this.records = records;
  };

  setRecord = (record: Record) => {
    const index = this.records.findIndex((rec) => rec.id === record.id);
    if (index > -1) {
      this.records[index] = record;
    } else {
      this.records.push(record);
    }
  };

  setStatuses = (newStatuses: { [key: string]: ListenerStatus }) => {
    this.statuses = {
      ...this.statuses,
      ...newStatuses,
    };
  };

  buildFolderSubmenu = (filtered: Record[]): MenuItemConstructorOptions[] => {
    const connectionItems: MenuItemConstructorOptions[] = [];

    connectionItems.push({
      label: 'Connect All',
      click() {
        ipcMain.emit(
          UPDATE_LISTENERS,
          {},
          {
            connectionIds: filtered.map((rec) => rec.id),
            connected: true,
          }
        );
      },
    });

    connectionItems.push({
      label: 'Disconnect All',
      click() {
        ipcMain.emit(
          UPDATE_LISTENERS,
          {},
          {
            connectionIds: filtered.map((rec) => rec.id),
            connected: false,
          }
        );
      },
    });

    connectionItems.push({
      type: 'separator',
    });

    filtered.forEach((rec) => {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const that = this;
      const iconName = this.statuses[rec.id as string]?.listening
        ? 'connected.png'
        : 'disconnected.png';

      connectionItems.push({
        label: rec?.conn?.name as string,
        icon: nativeImage.createFromPath(path.join(menuIconPath, iconName)),
        click() {
          ipcMain.emit(
            UPDATE_LISTENERS,
            {},
            {
              connectionIds: [rec.id],
              connected: !that.statuses[rec.id as string]?.listening,
            }
          );
        },
      });
    });
    return connectionItems;
  };

  buildMenuTemplate = () => {
    const { appWindow } = this;
    const template: (MenuItemConstructorOptions | MenuItem)[] = [];
    template.push({
      label: 'Add Connection',
      accelerator: 'CommandOrControl+A',
      click() {
        appWindow?.webContents.send('redirectTo', '/connectForm');
        appWindow?.show();
      },
    });

    this.tags.forEach((tag) => {
      const conns = this.buildFolderSubmenu(
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
