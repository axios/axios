import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 60000,
    projects: [
      {
        test: {
          name: 'module',
          environment: 'node',
          include: ['tests/**/*.module.test.js'],
          setupFiles: [],
        },
      },
    ],
  },
});
