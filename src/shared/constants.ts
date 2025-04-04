import { ServiceError } from '@grpc/grpc-js';

import { Records, Selector } from './pb/api';

export const isProd = process.env.NODE_ENV === 'production';
export const isDev = process.env.NODE_ENV === 'development';
export const prodDebug = process.env.DEBUG_PROD === 'true';

export const TOAST_LENGTH = 2000;

// Actions for the ipcMain and ipcRenderer messages
export const CONNECT = 'connect';
export const CONNECT_ALL = 'connect-all';
export const DELETE = 'delete';
export const DELETE_ALL = 'delete-all';
export const DISCONNECT = 'disconnect';
export const DISCONNECT_ALL = 'disconnect-all';
export const DUPLICATE = 'duplicate';
export const EDIT = 'edit';
export const EXPORT = 'export';
export const FETCH_ROUTES = 'fetch-routes';
export const GET_ALL_RECORDS = 'get_all_records';
export const GET_RECORDS = 'get_records';
export const GET_UNIQUE_TAGS = 'get_tags';
export const IMPORT = 'import';
export const LISTENER_LOG = 'listener_log';
export const LISTENER_STATUS = 'listener_status';
export const SAVE_RECORD = 'save_record';
export const UPDATE_LISTENERS = 'update_listeners';
export const VIEW = 'view';
export const VIEW_CONNECTION_LIST = 'view-connection-list';

export interface ExportFile {
  selector: Selector;
  filename: string;
  includeTags?: boolean;
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

export interface GetRecordsResponseArgs {
  err?: ServiceError | null;
  res?: Records;
}
