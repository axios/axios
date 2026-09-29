import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'build-artifacts',
    environment: 'node',
    include: ['tests/build/**/*.test.js'],
    setupFiles: [],
  },
});
