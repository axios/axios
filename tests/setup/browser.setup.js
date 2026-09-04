import { afterEach } from 'vitest';

// Keep the baseline browser suite on axios's synchronous document.cookie path.
// Tests for the asynchronous branch opt in with an explicit cookieStore mock.
Object.defineProperty(window, 'cookieStore', {
  configurable: true,
  writable: true,
  value: undefined,
});

afterEach(() => {
  document.body.innerHTML = '';
});
