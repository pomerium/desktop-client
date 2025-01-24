import { ipcRenderer } from 'electron';

import { FETCH_ROUTES, GET_ALL_RECORDS, SAVE_RECORD } from './constants';
import {
  FetchRoutesRequest,
  FetchRoutesResponse,
  Record,
  Records,
} from './pb/api';

function invoke(name: string, ...args: any[]): Promise<any> {
  return new Promise((resolve, reject) => {
    ipcRenderer.once(name, (_evt, result) => {
      const { res, err } = result;
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
    ipcRenderer.send(name, ...args);
  });
}

export async function fetchRoutes(
  request: FetchRoutesRequest,
): Promise<FetchRoutesResponse> {
  return invoke(FETCH_ROUTES, request);
}

export async function getAllRecords(): Promise<Records> {
  return invoke(GET_ALL_RECORDS);
}

export async function saveRecord(record: Record): Promise<Record> {
  return invoke(SAVE_RECORD, record);
}
