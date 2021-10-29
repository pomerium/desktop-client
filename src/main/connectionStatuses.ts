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
  connectionsData: Record<ConnectionData['connectionID'], ConnectionData> = {};
  menuConnections: Record<MenuConnection['connectionID'], MenuConnection> = {};

  constructor() {
    this.createMenuItems();
  }

  getPort = (text: string) => {
    const parts = text.split(':');
    return parseInt(parts[parts.length - 1], 10);
  };

  connect(
    connectionID: MenuConnection['connectionID'],
    evt: IpcMainEvent | null
  ) {
    const conn = this.menuConnections[connectionID];
    if (conn.connectionID) {
      this.disconnect(conn.connectionID);
      const child = spawnTcpConnect(this.connectionsData[connectionID]);
      child.stderr.setEncoding('utf8');
      conn.child = child;
      child.stderr.on('data', (data) => {
        conn.output.push(data.toString());
        evt?.sender.send(CONNECTION_RESPONSE, {
          output: conn.output,
          connectionID,
        });
        conn.port = `:${this.getPort(data.toString())}`;
      });
      child.on('exit', (code) => {
        evt?.sender.send(CONNECTION_CLOSED, {
          code,
          connectionID,
        });
        child.removeAllListeners();
      });
    }
  }

  delete(connectionID: MenuConnection['connectionID']) {
    this.disconnect(connectionID);
    delete this.menuConnections[connectionID];
    const connHandler = new Connections();
    connHandler.deleteConnection(connectionID);
  }

  disconnect(connectionID: MenuConnection['connectionID']) {
    this.menuConnections[connectionID].child?.kill();
    this.menuConnections[connectionID].child = null;
  }

  createMenuItems() {
    const connHandler = new Connections();
    this.connectionsData = connHandler.connectionsData;
    Object.values(this.connectionsData).forEach((conn) => {
      this.createMenuConnectionFromData(conn);
    });
  }

  createMenuConnectionFromData(conn: ConnectionData) {
    this.menuConnections[conn.connectionID] = {
      name: conn.name,
      connectionID: conn.connectionID,
      child: this.menuConnections[conn.connectionID]?.child || null,
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
