import { app } from 'electron';
import path from 'path';
import * as child_process from 'child_process';
import getPlatform from '../platform';

export const RESOURCES_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'assets')
  : path.join(__dirname, '../../assets');

export const getAssetPath = (...paths: string[]): string => {
  return path.join(RESOURCES_PATH, ...paths);
};

export const pomeriumCli: string = getAssetPath(
  getPlatform(),
  'bin',
  'pomerium-cli'
);

export interface TcpConnectArgs {
  destinationUrl: string;
  localAddress?: string;
  pomeriumUrl?: string;
  disableTLS?: boolean;
}

const buildSpawnArgs = (args: TcpConnectArgs) => {
  const spawnArgs = ['tcp', args.destinationUrl];
  if (args.localAddress) {
    spawnArgs.push(`--listen`);
    spawnArgs.push(args.localAddress);
  }
  if (args.pomeriumUrl) {
    spawnArgs.push(`--pomerium-url ${args.pomeriumUrl}`);
  }
  if (args.disableTLS) {
    spawnArgs.push('--disable-tls-verification');
  }
  return spawnArgs;
};

export const spawnTcpConnect = (
  args: TcpConnectArgs
): child_process.ChildProcessWithoutNullStreams => {
  return child_process.spawn(pomeriumCli, buildSpawnArgs(args));
};
