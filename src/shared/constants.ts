import { Selector } from './pb/api';

export const isProd = process.env.NODE_ENV === 'production';
export const isDev = process.env.NODE_ENV === 'development';
export const prodDebug = process.env.DEBUG_PROD === 'true';

export const TOAST_LENGTH = 2000;

// Actions for the ipcMain and ipcRenderer messages
export const CONNECTION_RESPONSE = 'connection-resp';
export const CONNECTION_CLOSED = 'connection-close';
export const DISCONNECT_ALL = 'disconnect-all';
export const DISCONNECT = 'disconnect';
export const UPDATE_LISTENERS = 'update_listeners';
export const LISTENER_STATUS = 'listener_status';
export const LISTENER_LOG = 'listener_log';
export const CONNECT_ALL = 'connect-all';
export const CONNECT = 'connect';
export const SAVE_RECORD = 'save_record';
export const GET_RECORDS = 'get_records';
export const GET_ALL_RECORDS = 'get_all_records';
export const GET_UNIQUE_TAGS = 'get_tags';
export const EDIT = 'edit';
export const VIEW = 'view';
export const VIEW_CONNECTION_LIST = 'view-connection-list';
export const DELETE = 'delete';
export const DELETE_ALL = 'delete-all';
export const DUPLICATE = 'duplicate';
export const EXPORT = 'export';
export const EXPORT_ALL = 'export-all';
export const IMPORT = 'import';
export interface QueryParams {
  connectionID: string;
}

export interface ExportFile {
  selector: Selector;
  filename: string;
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

export const THEMES = {
  LIGHT: 'LIGHT',
  DARK: 'DARK',
};
