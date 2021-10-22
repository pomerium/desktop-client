import Store from 'electron-store';
import { ConnectionData, MenuConnection } from './constants';
import { capitalize } from '@material-ui/core';

export const formatTag = (tag: string): string => {
  return tag
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((word) => capitalize(word.toLocaleLowerCase()))
    .join(' ');
};

export default class Connections {
  connectionsData: Record<ConnectionData['channelID'], ConnectionData> = {};
  menuConnections: Record<MenuConnection['channelID'], MenuConnection> = {};
  store: Store;

  constructor() {
    this.store = new Store({ name: 'connections' });
    const data = this.store.get('connections') as Record<
      ConnectionData['channelID'],
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
    this.connectionsData[conn.channelID] = conn;
    this.store.set('connections', this.connectionsData);
  }

  getConnection(channelID: ConnectionData['channelID']) {
    return this.connectionsData[channelID];
  }

  deleteConnection(channelID: ConnectionData['channelID']) {
    delete this.connectionsData[channelID];
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
