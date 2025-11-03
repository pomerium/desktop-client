import path from 'path';
import { execSync } from 'child_process';
import fs from 'fs';
import packageJson from '../../src/package.json' with { type: 'json' };

const { dependencies } = packageJson;

const nodeModulesPath = path.join(import.meta.dirname, '../../src/node_modules');

if (
  Object.keys(dependencies || {}).length > 0 &&
  fs.existsSync(nodeModulesPath)
) {
  const electronRebuildCmd =
    '../node_modules/.bin/electron-rebuild --parallel --force --types prod,dev,optional --module-dir .';
  const cmd =
    process.platform === 'win32'
      ? electronRebuildCmd.replace(/\//g, '\\')
      : electronRebuildCmd;
  execSync(cmd, {
    cwd: path.join(import.meta.dirname, '../../src'),
    stdio: 'inherit',
  });
}
