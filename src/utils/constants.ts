export const isProd = process.env.NODE_ENV === 'production';
export const isDev = process.env.NODE_ENV === 'development';
export const prodDebug = process.env.DEBUG_PROD === 'true';

export const CONNECTION_RESPONSE = 'connection-response';
export const CONNECTION_CLOSED = 'connection-close';
export const DISCONNECT = 'disconnect';
