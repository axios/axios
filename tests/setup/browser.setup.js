import { afterEach, vi } from 'vitest';

// Match native removal by both callback identity and capture mode.
export function countSignalListeners(signal) {
  const listeners = [new Set(), new Set()];
  const captureIndex = (options) =>
    Number(!!(typeof options === 'boolean' ? options : options && options.capture));
  const nativeAdd = signal.addEventListener;
  const nativeRemove = signal.removeEventListener;

  vi.spyOn(signal, 'addEventListener').mockImplementation((type, listener, options) => {
    if (type === 'abort' && listener != null) listeners[captureIndex(options)].add(listener);
    return nativeAdd.call(signal, type, listener, options);
  });
  vi.spyOn(signal, 'removeEventListener').mockImplementation((type, listener, options) => {
    if (type === 'abort') listeners[captureIndex(options)].delete(listener);
    return nativeRemove.call(signal, type, listener, options);
  });

  return () => listeners[0].size + listeners[1].size;
}

afterEach(() => {
  document.body.innerHTML = '';
});
