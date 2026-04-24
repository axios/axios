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
      sourceType: 'module'
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
  },
  {
    files: ['lib/**/*.js'],
    ignores: [
      'lib/adapters/http.js',
      'lib/adapters/xhr.js',
      'lib/platform/node/**/*.js',
      'lib/platform/browser/**/*.js'
    ],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      }
    }
  },
  {
    files: ['lib/adapters/http.js', 'lib/platform/node/**/*.js'],
    languageOptions: {
      globals: globals.node
    }
  },
  {
    files: ['lib/adapters/xhr.js', 'lib/platform/browser/**/*.js'],
    languageOptions: {
      globals: globals.browser
    }
  }
];
