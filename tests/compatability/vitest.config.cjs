const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
  test: {
    testTimeout: 10000,
    projects: [
      {
        test: {
          name: 'compatability',
          environment: 'node',
          include: ['tests/**/*.compat.test.cjs'],
          setupFiles: [],
        },
      },
    ],
  },
});
