import { afterEach } from 'vitest';

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'cookieStore', {
    configurable: true,
    writable: true,
    value: undefined
  });
}

afterEach(() => {
  document.body.innerHTML = '';
});
