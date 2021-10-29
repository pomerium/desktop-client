import Store from 'electron-store';
import { capitalize } from '@material-ui/core';
import { ConnectionData, MenuConnection } from './constants';

export const formatTag = (tag: string): string => {
  return tag
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((word) => capitalize(word.toLocaleLowerCase()))
    .join(' ');
};

export default class Connections {
  connectionsData: Record<ConnectionData['connectionID'], ConnectionData> = {};

  menuConnections: Record<MenuConnection['connectionID'], MenuConnection> = {};

  store: Store;

  constructor() {
    this.store = new Store({ name: 'connections' });
    const data = this.store.get('connections') as Record<
      ConnectionData['connectionID'],
      ConnectionData
    >;
    if (data) {
      this.connectionsData = data;
    }
  }

  getPort = (text: string) => {
    const parts = text.split(':');
    return parseInt(parts[parts.length - 1], 10);
  };

  saveConnection(conn: ConnectionData) {
    this.connectionsData[conn.connectionID] = conn;
    this.store.set('connections', this.connectionsData);
  }

  getConnection(connectionID: ConnectionData['connectionID']) {
    return this.connectionsData[connectionID];
  }

  deleteConnection(connectionID: ConnectionData['connectionID']) {
    delete this.connectionsData[connectionID];
    this.store.set('connections', this.connectionsData);
  }

  getConnections() {
    return this.connectionsData;
  }

  getExistingTags() {
    const existingTags = new Set<string>();
    Object.entries(this.connectionsData).forEach(([_, connection]) => {
      connection?.tags?.forEach((tag) => {
        existingTags.add(tag);
      });
    });
    return [...existingTags].sort();
  }
}
