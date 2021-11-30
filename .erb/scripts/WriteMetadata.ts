import { execSync } from 'child_process';
import { writeFileSync } from 'fs';

const { pomeriumCli } = require('../../package.json');

const gitHash = execSync('git rev-parse --short HEAD');
const cliVersion = pomeriumCli.version;

writeFileSync(
  './src/meta.json',
  JSON.stringify({
    gitHash: gitHash.toString().trimRight(),
    cliVersion: cliVersion,
  })
);
