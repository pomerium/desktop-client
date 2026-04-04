import {
  clipboard,
  contextBridge,
  ipcRenderer,
  IpcRendererEvent,
} from 'electron';

type IpcCallback = (event: IpcRendererEvent, ...args: any[]) => void;

contextBridge.exposeInMainWorld('electronAPI', {
  ipcRenderer: {
    send: (channel: string, ...args: any[]) => {
      ipcRenderer.send(channel, ...args);
    },
    on: (channel: string, callback: IpcCallback) => {
      ipcRenderer.on(channel, callback);
    },
    once: (channel: string, callback: IpcCallback) => {
      ipcRenderer.once(channel, callback);
    },
    removeAllListeners: (channel: string) => {
      ipcRenderer.removeAllListeners(channel);
    },
    removeListener: (channel: string, callback: (...args: any[]) => void) => {
      ipcRenderer.removeListener(channel, callback);
    },
  },
  clipboard: {
    writeText: (text: string) => {
      clipboard.writeText(text);
    },
  },
  platform: process.platform,
});
