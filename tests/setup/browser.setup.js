import { afterEach } from 'vitest';
import './nativeCookieStore.js';

// Keep the baseline browser suite on axios's synchronous document.cookie path.
// Async tests opt in with an explicit mock or the saved native Cookie Store.
Object.defineProperty(window, 'cookieStore', {
  configurable: true,
  writable: true,
  value: undefined,
});

afterEach(() => {
  document.body.innerHTML = '';
});
