interface ElectronAPI {
  ipcRenderer: {
    send: (channel: string, ...args: any[]) => void;
    on: (channel: string, callback: (...args: any[]) => void) => void;
    once: (channel: string, callback: (...args: any[]) => void) => void;
    removeAllListeners: (channel: string) => void;
    removeListener: (
      channel: string,
      callback: (...args: any[]) => void,
    ) => void;
  };
  clipboard: {
    writeText: (text: string) => void;
  };
  platform: string;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
