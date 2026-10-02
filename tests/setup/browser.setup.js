import { afterEach, vi } from 'vitest';

// Track listener identities so removing a different function cannot hide a leak.
export function countSignalListeners(signal) {
  const listeners = new Set();
  const nativeAdd = signal.addEventListener;
  const nativeRemove = signal.removeEventListener;

  vi.spyOn(signal, 'addEventListener').mockImplementation((type, listener, options) => {
    if (type === 'abort') listeners.add(listener);
    return nativeAdd.call(signal, type, listener, options);
  });
  vi.spyOn(signal, 'removeEventListener').mockImplementation((type, listener, options) => {
    if (type === 'abort') listeners.delete(listener);
    return nativeRemove.call(signal, type, listener, options);
  });

  return () => listeners.size;
}

afterEach(() => {
  document.body.innerHTML = '';
});
