import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ...js.configs.recommended,
    files: ['lib/**/*.js'],
    linterOptions: {
      reportUnusedDisableDirectives: 'off'
    },
    languageOptions: {
      ecmaVersion: 2018,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-cond-assign': 0,
      'no-useless-assignment': 'off',
      'no-unused-vars': [
        'error',
        { args: 'none', caughtErrors: 'none', varsIgnorePattern: '^_' }
      ]
    }
  }
];
