module.exports = {
  extends: ['erb', 'plugin:@typescript-eslint/recommended'],
  rules: {
    // A temporary hack related to IDE not resolving correct package.json
    'import/no-extraneous-dependencies': 'off',
    // console output is fine for a Node.js application
    'no-console': 'off',
    // cause sometimes concat is more readable
    'prefer-template': 'off',
    'react-hooks/exhaustive-deps': 'off',
    'no-explicit-any': 'off',
    'import/no-unresolved': 'off',
    'import/extensions': 'off',
    'react/function-component-definition': 'off',
    'react/jsx-filename-extension': 'off',
    'react/no-unstable-nested-components': 'off',
    'class-methods-use-this': 'off',
    'react/jsx-no-useless-fragment': 'off',
    'no-unsafe-optional-chaining': 'off',
    'no-promise-executor-return': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-this-alias': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    'no-await-in-loop': 'off',
    'no-continue': 'off',
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
    createDefaultProgram: true,
  },
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
  },
};
