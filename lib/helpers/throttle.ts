'use strict';

/**
 * Throttle decorator
 * @param {Function} fn
 * @param {Number} freq
 * @return {Function}
 */
function throttle(fn: (...args: any[]) => any, freq: number) {
  let timestamp = 0;
  const threshold = 1000 / freq;
  let timer: ReturnType<typeof setTimeout> | null = null;
  return function throttled(force: boolean, args: any[]) {
    const now = Date.now();
    if (force || now - timestamp > threshold) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      timestamp = now;
      return fn.apply(null, args);
    }
    if (!timer) {
      timer = setTimeout(() => {
        timer = null;
        timestamp = Date.now();
        return fn.apply(null, args);
      }, threshold - (now - timestamp));
    }
  };
}

export default throttle;
