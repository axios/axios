import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 10000,
    projects: [
      {
        test: {
          name: 'compatability',
          environment: 'node',
          include: ['tests/**/*.compat.test.js'],
          setupFiles: [],
        },
      },
    ],
  },
});
