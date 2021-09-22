import axios from 'axios';
import path from 'path';
import { createWriteStream } from 'fs';
import fs from 'fs';

const { createGunzip } = require('gunzip-stream');
const tar = require('tar-stream');
const unzip = require('unzip-stream');

const pomeriumVersion = 'v0.15.3';
const pomeriumBuilds: { [char: string]: string[] } = {
  linux: ['amd64', 'arm64'],
  windows: ['amd64'],
  darwin: ['amd64', 'arm64'],
};
const baseSavePath = './system_files';

const resolveDetails = (platform: string, arch: string) => {
  let details = {
    platform: platform,
    arch: arch,
    format: 'tar.gz',
    binary: 'pomerium-cli',
  };

  switch (platform) {
    case 'windows':
      details.platform = 'win';
      details.format = 'zip';
      details.binary = 'pomerium-cli.exe';
      break;
    case 'darwin':
      details.platform = 'mac';
      break;
  }

  switch (arch) {
    case 'amd64':
    case 'x86_64':
      details.arch = 'x64';
      break;
  }

  return details;
};

const fetchURL = async (platform: string, arch: string) => {
  const saveDetails = resolveDetails(platform, arch);
  const savePath = path.join(
    baseSavePath,
    saveDetails.platform,
    saveDetails.arch,
    'bin',
    saveDetails.binary
  );
  const url = `https://github.com/pomerium/pomerium/releases/download/${pomeriumVersion}/pomerium-cli-${platform}-${arch}.${saveDetails.format}`;

  console.log(`downloading '${url}' => '${savePath}'`);

  fs.mkdirSync(path.dirname(savePath), { recursive: true });

  let resp = await axios
    .get(url, { responseType: 'stream' })
    .then((response: { data: any }) => {
      return response.data;
    });

  const writeStream = createWriteStream(savePath).on('finish', () => {
    fs.chmodSync(savePath, '0755');
  });

  if (saveDetails.format == 'tar.gz') {
    resp.pipe(createGunzip()).pipe(
      tar
        .extract()
        .on('entry', (header: any, stream: any, next: () => void) => {
          stream.on('end', () => {
            next();
          });

          if (header.name == saveDetails.binary) {
            stream.pipe(writeStream);
          }
          stream.resume();
        })
    );
  } else if (saveDetails.format == 'zip') {
    resp.pipe(unzip.Parse()).on('entry', (entry: any) => {
      if (entry.path == saveDetails.binary) {
        entry.pipe(writeStream);
      } else {
        entry.autodrain();
      }
    });
  } else {
    throw 'unknown file format: ' + saveDetails.format;
  }
};

try {
  Object.keys(pomeriumBuilds).forEach((platform) => {
    pomeriumBuilds[platform].forEach(async (arch: string) => {
      await fetchURL(platform, arch);
    });
  });
} catch (error) {
  console.log(error);
}
