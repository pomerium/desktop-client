import { app } from 'electron';
import path from 'path';
import * as child_process from 'child_process';
import { ConnectionData } from './constants';

export const RESOURCES_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'assets')
  : path.join(__dirname, '../../assets');

export const getAssetPath = (...paths: string[]): string => {
  return path.join(RESOURCES_PATH, ...paths);
};

export const menuIconPath: string = getAssetPath('icons');

export const pomeriumCli: string = getAssetPath(
  'bin','pomerium-cli'
);

const buildSpawnArgs = (args: ConnectionData) => {
  const spawnArgs = ['tcp', args.destinationUrl];
  if (args.localAddress) {
    spawnArgs.push(`--listen`);
    spawnArgs.push(args.localAddress);
  }
  if (args.pomeriumUrl) {
    spawnArgs.push(`--pomerium-url`);
    spawnArgs.push(args.pomeriumUrl);
  }
  if (args.disableTLS) {
    spawnArgs.push('--disable-tls-verification');
  }

  if (args.caFilePath) {
    spawnArgs.push(`--alternate-ca-path`);
    spawnArgs.push(args.caFilePath);
  }

  if (args.caFileText) {
    spawnArgs.push(`--ca-cert`);
    spawnArgs.push(btoa(args.caFileText));
  }

  return spawnArgs;
};

export const spawnTcpConnect = (
  args: ConnectionData
): child_process.ChildProcessWithoutNullStreams => {
  return child_process.spawn(pomeriumCli, buildSpawnArgs(args));
};
