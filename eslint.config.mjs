import eslintReact from '@eslint-react/eslint-plugin';
import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import compat from 'eslint-plugin-compat';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import promise from 'eslint-plugin-promise';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    // Migrated from the old .eslintignore. node_modules and .git are ignored
    // by default in flat config.
    ignores: [
      'out/**',
      'release/**',
      'build/Release/**',
      'coverage/**',
      'lib-cov/**',
      '.grunt/**',
      '__snapshots__/**',
      'assets/**',
      'scripts/**',
      'electron.vite.config.ts',
      'vitest.config.ts',
      '**/*.css.d.ts',
      '**/*.sass.d.ts',
      '**/*.scss.d.ts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  eslintReact.configs['recommended-typescript'],
  jsxA11y.flatConfigs.recommended,
  promise.configs['flat/recommended'],
  compat.configs['flat/recommended'],
  // must come last: disables eslint rules that conflict with prettier
  eslintConfigPrettier,
  {
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      // rules-of-hooks is enforced by @eslint-react's recommended config.
      // The project has never enforced exhaustive-deps, so turn off the
      // version @eslint-react enables in recommended.
      '@eslint-react/exhaustive-deps': 'off',
      // console output is fine for a Node.js application
      'no-console': 'off',
      // cause sometimes concat is more readable
      'prefer-template': 'off',
      // MUI components (e.g. TextField) are non-DOM; airbnb ignored these
      'jsx-a11y/no-autofocus': ['error', { ignoreNonDOM: true }],
      'class-methods-use-this': 'off',
      'no-unsafe-optional-chaining': 'off',
      'no-promise-executor-return': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-this-alias': 'off',
      // allows the conditional dev-only require('electron-debug') in main/index.ts
      '@typescript-eslint/no-require-imports': 'off',
      // because of how we do ipc we need to save routes one at a time,
      // awaiting in a loop makes sense
      'no-await-in-loop': 'off',
      // continue is fine
      'no-continue': 'off',
      // eslint doesn't seem to understand for ... of
      'no-restricted-syntax': 'off',
      // allow property assignment on function parameters
      'no-param-reassign': ['error', { props: false }],
    },
  },
  {
    // generated protobuf code carries blanket eslint-disable headers; don't
    // flag them as unused
    files: ['src/shared/pb/**'],
    linterOptions: {
      reportUnusedDisableDirectives: 'off',
    },
  },
);
