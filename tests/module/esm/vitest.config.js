import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'module',
          testTimeout: 60000,
          environment: 'node',
          include: ['tests/**/*.module.test.js'],
          setupFiles: [],
        },
      },
    ],
  },
});
