import path from 'path';
import { fileURLToPath } from 'url';
import rimraf from 'rimraf';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function deleteSourceMaps() {
  rimraf.sync(path.join(__dirname, '../../src/dist/*.js.map'));
  rimraf.sync(path.join(__dirname, '../../src/*.js.map'));
}
