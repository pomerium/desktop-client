import '@testing-library/jest-dom';

import {
  GET_ALL_RECORDS,
  GET_UNIQUE_TAGS,
  LISTENER_STATUS,
} from '../../shared/constants';
import type {
  ListenerStatusResponse,
  Record as ListenerRecord,
} from '../../shared/pb/api';
import {
  registerConnectionDataListeners,
  requestConnectionData,
} from './connectionData';

type MockIpcRenderer = {
  send: jest.Mock;
  on: jest.Mock;
  removeListener: jest.Mock;
};

type Listener = (event: unknown, args: unknown) => void;

type ListenerMap = Map<string, Listener[]>;

const createIpcMock = (listenerMap: ListenerMap): MockIpcRenderer => {
  return {
    send: jest.fn(),
    on: jest.fn((channel: string, listener: Listener) => {
      const existing = listenerMap.get(channel) ?? [];
      listenerMap.set(channel, [...existing, listener]);
      return undefined;
    }),
    removeListener: jest.fn((channel: string, listener: Listener) => {
      const existing = listenerMap.get(channel) ?? [];
      listenerMap.set(
        channel,
        existing.filter((registered) => registered !== listener),
      );
    }),
  };
};

const emitFromMain = (
  listeners: ListenerMap,
  channel: string,
  payload: unknown,
) => {
  const registered = listeners.get(channel) ?? [];
  registered.forEach((listener) => listener({}, payload));
};

describe('connectionData IPC bridge', () => {
  it('sends requests for initial connection data', () => {
    const listeners: ListenerMap = new Map();
    const ipc = createIpcMock(listeners);

    requestConnectionData(ipc);

    expect(ipc.send).toHaveBeenCalledWith(
      LISTENER_STATUS,
      expect.objectContaining({ all: true }),
    );
    expect(ipc.send).toHaveBeenCalledWith(GET_UNIQUE_TAGS);
    expect(ipc.send).toHaveBeenCalledWith(GET_ALL_RECORDS);
  });

  it('dispatches incoming data and cleans up listeners', () => {
    const listeners: ListenerMap = new Map();
    const ipc = createIpcMock(listeners);

    const handlers = {
      onRecords: jest.fn(),
      onTags: jest.fn(),
      onStatuses: jest.fn(),
      onError: jest.fn(),
    };

    const teardown = registerConnectionDataListeners(ipc, handlers);

    const record: ListenerRecord = {
      id: 'record-1',
      tags: ['ssh'],
      conn: {
        remoteAddr: 'tcp://example:2222',
      },
    };
    const statuses: ListenerStatusResponse = {
      listeners: {
        [record.id ?? '']: { listening: true },
      },
    };

    emitFromMain(listeners, GET_UNIQUE_TAGS, { tags: ['ssh'] });
    emitFromMain(listeners, GET_ALL_RECORDS, {
      res: { records: [record] },
    });
    emitFromMain(listeners, LISTENER_STATUS, { res: statuses });

    expect(handlers.onTags).toHaveBeenCalledWith(['ssh']);
    expect(handlers.onRecords).toHaveBeenCalledWith([record]);
    expect(handlers.onStatuses).toHaveBeenCalledWith(statuses);

    emitFromMain(listeners, GET_ALL_RECORDS, {
      err: new Error('boom'),
    });
    expect(handlers.onError).toHaveBeenCalledWith('boom');

    teardown();

    expect(ipc.removeListener).toHaveBeenCalledWith(
      GET_ALL_RECORDS,
      expect.any(Function),
    );
    expect(ipc.removeListener).toHaveBeenCalledWith(
      GET_UNIQUE_TAGS,
      expect.any(Function),
    );
    expect(ipc.removeListener).toHaveBeenCalledWith(
      LISTENER_STATUS,
      expect.any(Function),
    );
  });
});
