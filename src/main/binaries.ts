import { app } from 'electron';
import path from 'path';

export const RESOURCES_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'assets')
  : path.join(__dirname, '../../assets');

export const getAssetPath = (...paths: string[]): string => {
  return path.join(RESOURCES_PATH, ...paths);
};

export const menuIconPath: string = getAssetPath('icons');

export const pomeriumCli: string = getAssetPath('bin', 'pomerium-cli');
