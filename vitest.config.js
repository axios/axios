import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

const echoRequestBody = {
  name: 'axios-test-echo-request-body',
  configureServer(server) {
    server.middlewares.use('/__axios_test_echo__', (req, res) => {
      const chunks = [];
      req.on('data', (chunk) => chunks.push(chunk));
      req.on('end', () => {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end(Buffer.concat(chunks));
      });
    });
  },
};

export default defineConfig({
  plugins: [echoRequestBody],
  test: {
    testTimeout: 10000,
    projects: [
      {
        test: {
          name: 'unit',
          environment: 'node',
          include: ['tests/unit/**/*.test.js'],
          setupFiles: [],
        },
      },
      {
        test: {
          name: 'browser',
          include: ['tests/browser/**/*.browser.test.js'],
          browser: {
            enabled: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
          setupFiles: ['tests/setup/browser.setup.js'],
        },
      },
      {
        test: {
          name: 'browser-headless',
          include: ['tests/browser/**/*.browser.test.js'],
          browser: {
            enabled: true,
            provider: playwright(),
            instances: [
              { browser: 'chromium', headless: true },
              { browser: 'firefox', headless: true },
              { browser: 'webkit', headless: true },
            ],
          },
          setupFiles: ['tests/setup/browser.setup.js'],
        },
      },
    ],
  },
});
