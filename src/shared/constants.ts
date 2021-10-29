import child_process from 'child_process';

export const isProd = process.env.NODE_ENV === 'production';
export const isDev = process.env.NODE_ENV === 'development';
export const prodDebug = process.env.DEBUG_PROD === 'true';

export const CONNECTION_RESPONSE = 'connection-response';
export const CONNECTION_CLOSED = 'connection-close';
export const DISCONNECT_ALL = 'disconnect-all';
export const DISCONNECT = 'disconnect';
export const CONNECT_ALL = 'connect-all';
export const CONNECT = 'connect';
export const DELETE = 'delete';
export const DELETE_ALL = 'delete-all';
export const DUPLICATE = 'duplicate';
export const EXPORT = 'export';
export const EXPORT_ALL = 'export-all';
export const IMPORT = 'import';
export const CONNECTION_SAVED = 'connection-saved';

export interface FolderActionData {
  folderName: string;
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
