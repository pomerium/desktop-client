import child_process from 'child_process';

export const isProd = process.env.NODE_ENV === 'production';
export const isDev = process.env.NODE_ENV === 'development';
export const prodDebug = process.env.DEBUG_PROD === 'true';
// Actions for the ipcMain and ipcRenderer messages
export const CONNECTION_RESPONSE = 'connection-resp';
export const CONNECTION_CLOSED = 'connection-close';
export const DISCONNECT_ALL = 'disconnect-all';
export const DISCONNECT = 'disconnect';
export const CONNECT_ALL = 'connect-all';
export const CONNECT = 'connect';
export const SAVE = 'save';
export const SAVE_RESPONSE = 'save_resp';
export const GET_RECORDS_RESPONSE = 'get_records_resp';
export const GET_RECORDS = 'get_records';
export const GET_UNIQUE_TAGS = 'get_tags';
export const GET_UNIQUE_TAGS_RESPONSE = 'get_tags_resp';
export const EDIT = 'edit';
export const VIEW = 'view';
export const VIEW_CONNECTION_LIST = 'view-connection-list';
export const DELETE = 'delete';
export const DELETE_ALL = 'delete-all';
export const DELETE_RESPONSE = 'delete-resp';
export const DUPLICATE = 'duplicate';
export const EXPORT = 'export';
export const EXPORT_ALL = 'export-all';
export const IMPORT = 'import';
export const CONNECTION_SAVED = 'connection-saved';

export interface QueryParams {
  connectionID: string;
}

export interface ConnectionData {
  name: string;
  destinationUrl: string;
  connectionID: string;
  localAddress?: string;
  pomeriumUrl?: string;
  disableTLS?: boolean;
  caFilePath?: string;
  caFileText?: string;
  tags: string[];
}

export interface MenuConnection {
  name: string;
  url: string;
  port: string;
  child: child_process.ChildProcessWithoutNullStreams | null;
  connectionID: string;
  output: string[];
  tags: string[];
}

export const THEMES = {
  LIGHT: 'LIGHT',
  DARK: 'DARK',
};
