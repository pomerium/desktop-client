import path from 'path';
import rimraf from 'rimraf';

export default function deleteSourceMaps() {
  rimraf.sync(path.join(import.meta.dirname, '../../src/dist/*.js.map'));
  rimraf.sync(path.join(import.meta.dirname, '../../src/*.js.map'));
}
