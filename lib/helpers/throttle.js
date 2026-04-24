/**
 * @fileoverview A simple throttle utility to control how often a function runs.
 * Executes at most `freq` times per second, with an optional `flush` method to
 * trigger the last pending call immediately.
 *
 * @example
 * import throttle from './throttle.js';
 *
 * const [throttled, flush] = throttle(() => console.log('Scroll!'), 2);
 * window.addEventListener('scroll', throttled);
 * flush(); // runs the last pending call, if any
 */

/**
 * Throttle decorator
 * @param {Function} fn - Function to throttle.
 * @param {number} freq - Allowed executions per second.
 * @returns {[Function, Function]} [throttledFn, flush]
 */
function throttle(fn, freq) {
  let timestamp = 0;
  const threshold = 1000 / freq;
  let lastArgs, timer;

  const invoke = (args, now = Date.now()) => {
    timestamp = now;
    lastArgs = null;
    clearTimeout(timer);
    timer = null;
    fn(...args);
  };

  const throttled = (...args) => {
    const now = Date.now();
    const passed = now - timestamp;
    if (passed >= threshold) {
      invoke(args, now);
    } else {
      lastArgs = args;
      if (!timer) {
        timer = setTimeout(() => {
          timer = null;
          invoke(lastArgs);
        }, threshold - passed);
      }
    }
  };

  const flush = () => lastArgs && invoke(lastArgs);

  return [throttled, flush];
}

export default throttle;
