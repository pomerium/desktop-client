import Store from 'electron-store';
import { IpcMainEvent } from 'electron';
import { spawnTcpConnect } from './binaries';
import {
  CONNECTION_CLOSED,
  CONNECTION_RESPONSE,
  ConnectionData,
  MenuConnection,
} from '../shared/constants';

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
    Object.values(this.connectionsData).forEach((conn) => {
      this.createMenuConnectionFromData(conn);
    });
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
    this.disconnect(channelID);
    delete this.connectionsData[channelID];
    delete this.menuConnections[channelID];
    this.store.set('connections', this.connectionsData);
  }

  getConnections() {
    return this.connectionsData;
  }

  connect(channelID: MenuConnection['channelID'], evt: IpcMainEvent | null) {
    const conn = this.menuConnections[channelID];
    if (conn.channelID) {
      this.disconnect(conn.channelID);
      const child = spawnTcpConnect(this.connectionsData[channelID]);
      child.stderr.setEncoding('utf8');
      conn.child = child;
      child.stderr.on('data', (data) => {
        conn.output.push(data.toString());
        evt?.sender.send(CONNECTION_RESPONSE, {
          output: conn.output,
          channelID,
        });
        conn.port = `:${this.getPort(data.toString())}`;
      });
      child.on('exit', (code) => {
        evt?.sender.send(CONNECTION_CLOSED, {
          code,
          channelID,
        });
        child.removeAllListeners();
      });
    }
  }

  disconnect(channelID: MenuConnection['channelID']) {
    this.menuConnections[channelID].child?.kill();
    this.menuConnections[channelID].child = null;
  }

  createMenuConnectionFromData(conn: ConnectionData) {
    this.menuConnections[conn.channelID] = {
      channelID: conn.channelID,
      child: this.menuConnections[conn.channelID]?.child || null,
      output: [],
      port: conn.localAddress || '',
      url: conn.destinationUrl,
    };
  }

  getMenuConnections() {
    return this.menuConnections;
  }
}
