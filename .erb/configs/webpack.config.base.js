/**
 * Base webpack config used across other specific configs
 */

import path from 'path';
import webpack from 'webpack';
import packageJson from '../../src/package.json' with { type: 'json' };

const { dependencies: externals } = packageJson;

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
    path: path.join(import.meta.dirname, '../../src'),
    libraryTarget: 'commonjs2',
  },

  /**
   * Determine the array of extensions that should be used to resolve modules.
   */
  resolve: {
    extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],
    modules: [path.join(import.meta.dirname, '../src'), 'node_modules'],
  },

  plugins: [
    new webpack.EnvironmentPlugin({
      NODE_ENV: 'production',
    }),
  ],
};
