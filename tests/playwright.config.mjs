import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './browser',
  testMatch: '*.spec.mjs',
  timeout: 20000,
  expect: { timeout: 5000 },
  forbidOnly: true,
  retries: 0,
  workers: 2,
  reporter: [['list'], ['html', { outputFolder: 'results/browser-report', open: 'never' }]],
  outputDir: 'results/browser-artifacts',
  use: { trace: 'retain-on-failure' },
  projects: ['chromium', 'firefox', 'webkit'].map((browserName) => ({
    name: browserName,
    use: { browserName },
  })),
});
