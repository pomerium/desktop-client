import { IpcMainEvent } from 'electron';
import { spawnTcpConnect } from './binaries';
import {
  CONNECTION_CLOSED,
  CONNECTION_RESPONSE,
  ConnectionData,
  MenuConnection,
} from '../shared/constants';
import Connections from '../shared/connections';

export default class ConnectionStatuses {
  connectionsData: Record<ConnectionData['channelID'], ConnectionData> = {};
  menuConnections: Record<MenuConnection['channelID'], MenuConnection> = {};

  constructor() {
    this.createMenuItems();
  }

  getPort = (text: string) => {
    const parts = text.split(':');
    return parseInt(parts[parts.length - 1], 10);
  };

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

  delete(channelID: MenuConnection['channelID']) {
    this.disconnect(channelID);
    delete this.menuConnections[channelID];
    const connHandler = new Connections();
    connHandler.deleteConnection(channelID);
  }

  disconnect(channelID: MenuConnection['channelID']) {
    this.menuConnections[channelID].child?.kill();
    this.menuConnections[channelID].child = null;
  }

  createMenuItems() {
    const connHandler = new Connections();
    this.connectionsData = connHandler.connectionsData;
    Object.values(this.connectionsData).forEach((conn) => {
      this.createMenuConnectionFromData(conn);
    });
  }

  createMenuConnectionFromData(conn: ConnectionData) {
    this.menuConnections[conn.channelID] = {
      name: conn.name,
      channelID: conn.channelID,
      child: this.menuConnections[conn.channelID]?.child || null,
      output: [],
      port: conn.localAddress || '',
      url: conn.destinationUrl,
      tags: conn.tags,
    };
  }

  getMenuConnections() {
    return this.menuConnections;
  }
}
