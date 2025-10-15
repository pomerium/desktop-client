import type { IpcRenderer } from 'electron';

import {
  GET_ALL_RECORDS,
  GET_UNIQUE_TAGS,
  LISTENER_STATUS,
} from '../../shared/constants';
import type {
  ListenerStatusResponse,
  Record as ListenerRecord,
  Selector,
} from '../../shared/pb/api';

type ListenerArgs<T> = {
  err?: Error;
  res?: T;
  tags?: string[];
};

type ConnectionDataHandlers = {
  onRecords: (records: ListenerRecord[]) => void;
  onTags: (tags: string[]) => void;
  onStatuses: (response: ListenerStatusResponse) => void;
  onError: (message: string) => void;
};

const defaultSelector: Selector = {
  all: true,
  ids: [],
  tags: [],
};

export const requestConnectionData = (ipc: Pick<IpcRenderer, 'send'>): void => {
  ipc.send(LISTENER_STATUS, defaultSelector);
  ipc.send(GET_UNIQUE_TAGS);
  ipc.send(GET_ALL_RECORDS);
};

const getErrorMessage = (error: Error | undefined): string | null => {
  if (!error) {
    return null;
  }
  return error.message || 'Unknown error';
};

export const registerConnectionDataListeners = (
  ipc: Pick<IpcRenderer, 'on' | 'removeListener'>,
  handlers: ConnectionDataHandlers,
): (() => void) => {
  const handleRecords = (
    _event: unknown,
    args: ListenerArgs<{ records: ListenerRecord[] }>,
  ) => {
    const errorMessage = getErrorMessage(args?.err);
    if (errorMessage) {
      handlers.onError(errorMessage);
      return;
    }
    handlers.onRecords(args?.res?.records ?? []);
  };

  const handleTags = (_event: unknown, args: ListenerArgs<unknown>) => {
    const errorMessage = getErrorMessage(args?.err);
    if (errorMessage) {
      handlers.onError(errorMessage);
      return;
    }
    handlers.onTags(args?.tags ?? []);
  };

  const handleStatuses = (
    _event: unknown,
    args: ListenerArgs<ListenerStatusResponse>,
  ) => {
    const errorMessage = getErrorMessage(args?.err);
    if (errorMessage) {
      handlers.onError(errorMessage);
      return;
    }
    handlers.onStatuses(args?.res ?? { listeners: {} });
  };

  ipc.on(GET_ALL_RECORDS, handleRecords as any);
  ipc.on(GET_UNIQUE_TAGS, handleTags as any);
  ipc.on(LISTENER_STATUS, handleStatuses as any);

  return () => {
    ipc.removeListener(GET_ALL_RECORDS, handleRecords as any);
    ipc.removeListener(GET_UNIQUE_TAGS, handleTags as any);
    ipc.removeListener(LISTENER_STATUS, handleStatuses as any);
  };
};

export type { ConnectionDataHandlers };
