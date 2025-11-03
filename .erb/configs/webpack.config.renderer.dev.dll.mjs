/**
 * Builds the DLL for development electron renderer process
 */

import webpack from 'webpack';
import path from 'path';
import { merge } from 'webpack-merge';
import baseConfig from './webpack.config.base.js';
import rendererDevConfig from './webpack.config.renderer.dev.mjs';
import CheckNodeEnv from '../scripts/CheckNodeEnv.js';
import packageJson from '../../package.json' with { type: 'json' };

const { dependencies } = packageJson;

CheckNodeEnv('development');

const dist = path.join(import.meta.dirname, '../dll');

export default merge(baseConfig, {
  context: path.join(import.meta.dirname, '../..'),

  devtool: 'eval',

  mode: 'development',

  target: 'electron-renderer',

  externals: ['fsevents', 'crypto-browserify'],

  /**
   * Use `module` from `webpack.config.renderer.dev.js`
   */
  module: rendererDevConfig.module,

  entry: {
    renderer: Object.keys(dependencies || {}),
  },

  output: {
    library: 'renderer',
    path: dist,
    filename: '[name].dev.dll.js',
    libraryTarget: 'var',
  },

  plugins: [
    new webpack.DllPlugin({
      path: path.join(dist, '[name].json'),
      name: '[name]',
    }),

    /**
     * Create global constants which can be configured at compile time.
     *
     * Useful for allowing different behaviour between development builds and
     * release builds
     *
     * NODE_ENV should be production so that modules do not perform certain
     * development checks
     */
    new webpack.EnvironmentPlugin({
      NODE_ENV: 'development',
    }),

    new webpack.LoaderOptionsPlugin({
      debug: true,
      options: {
        context: path.join(import.meta.dirname, '../../src'),
        output: {
          path: path.join(import.meta.dirname, '../dll'),
        },
      },
    }),
  ],
});
