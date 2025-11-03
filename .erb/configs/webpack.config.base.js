/**
 * Base webpack config used across other specific configs
 */

import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import webpack from 'webpack';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { dependencies: externals } = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../src/package.json'), 'utf8')
);

export default {
  externals: [
    ...Object.keys(externals || {}),
    { 'electron-debug': 'electron-debug' },
  ],

  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        exclude: /node_modules/,
        loader: 'esbuild-loader',
        options: {
          target: 'es2022',
          jsx: 'automatic',
        },
      },
      {
        test: /\.node$/,
        loader: "node-loader",
      },
    ],
  },

  output: {
    path: path.join(__dirname, '../../src'),
    libraryTarget: 'commonjs2',
  },

  /**
   * Determine the array of extensions that should be used to resolve modules.
   */
  resolve: {
    extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],
    modules: [path.join(__dirname, '../src'), 'node_modules'],
  },

  plugins: [
    new webpack.EnvironmentPlugin({
      NODE_ENV: 'production',
    }),
  ],
};
