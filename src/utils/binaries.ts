import { app } from 'electron';
import path from 'path';
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
