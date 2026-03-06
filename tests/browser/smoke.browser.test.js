import { expect, test } from 'vitest';

test('runs in browser environment', () => {
  document.body.innerHTML = '<div data-testid="smoke">vitest browser smoke</div>';

  const el = document.querySelector('[data-testid="smoke"]');

  expect(el?.textContent).toBe('vitest browser smoke');
  expect(globalThis.window).toBeDefined();
});
