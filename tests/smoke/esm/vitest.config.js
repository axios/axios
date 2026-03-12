import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 10000,
    projects: [
      {
        test: {
          name: 'smoke',
          environment: 'node',
          include: ['tests/**/*.smoke.test.js'],
          setupFiles: [],
        },
      },
    ],
  },
});
