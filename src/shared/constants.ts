import child_process from 'child_process';

export const isProd = process.env.NODE_ENV === 'production';
export const isDev = process.env.NODE_ENV === 'development';
export const prodDebug = process.env.DEBUG_PROD === 'true';

export const CONNECTION_RESPONSE = 'connection-response';
export const CONNECTION_CLOSED = 'connection-close';
export const DISCONNECT = 'disconnect';
export const CONNECT = 'connect';

export interface ConnectionData {
  destinationUrl: string;
  channelID: string;
  localAddress?: string;
  pomeriumUrl?: string;
  disableTLS?: boolean;
  caFilePath?: string;
  caFileText?: string;
}

export interface MenuConnection {
  url: string;
  port: string;
  child: child_process.ChildProcessWithoutNullStreams | null;
  channelID: string;
  output: string[];
}

export const THEMES = {
  LIGHT: 'LIGHT',
  DARK: 'DARK',
};
