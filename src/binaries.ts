import { app } from 'electron';
import { isPackaged } from 'electron-is-packaged';
import { rootPath as root } from 'electron-root-path';
import path from 'path';
import getPlatform from './platform';

const IS_PROD = process.env.NODE_ENV === 'production';

// todo: is there a better way? (i haven't found one)
function getAppRoot(): string {
  if (process.platform === 'win32') {
    return path.join(app.getAppPath(), '/../../../');
  }
  return path.join(app.getAppPath(), '/../../../../');
}

export const binariesPath =
  IS_PROD && isPackaged // the path to a bundled electron app.
    ? path.join(getAppRoot(), './assets', getPlatform(), './bin')
    : path.join(root, './assets', getPlatform(), './bin');

export const pomeriumCli: string = path.join(binariesPath, 'pomerium-cli');
