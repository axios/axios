import CanceledError from '../cancel/CanceledError.js';
import AxiosError from '../core/AxiosError.js';
import utils from '../utils.js';

const composeSignals = (signals, timeout) => {
  signals = signals ? signals.filter(Boolean) : [];

  if (!timeout && !signals.length) {
    return;
  }

  const controller = new AbortController();

  let aborted = false;

  const onabort = function (reason) {
    if (!aborted) {
      aborted = true;
      unsubscribe();
      const err = reason instanceof Error ? reason : this.reason;
      controller.abort(
        err instanceof AxiosError
          ? err
          : new CanceledError(err instanceof Error ? err.message : err)
      );
    }
  };

  let timer;

  const scheduleTimeout = (delay) => {
    // Timers overflow above the signed 32-bit delay limit and fire almost at once.
    timer = setTimeout(
      () => {
        if (delay > 0x7fffffff) {
          scheduleTimeout(delay - 0x7fffffff);
          return;
        }
        timer = null;
        onabort(new AxiosError(`timeout of ${timeout}ms exceeded`, AxiosError.ETIMEDOUT));
      },
      Math.min(delay, 0x7fffffff)
    );
  };

  timeout && scheduleTimeout(timeout);

  const unsubscribe = () => {
    if (!signals) {
      return;
    }
    timer && clearTimeout(timer);
    timer = null;
    signals.forEach((signal) => {
      const unsubscribeSignal = utils.getSafeProp(signal, 'unsubscribe');
      utils.isFunction(unsubscribeSignal)
        ? unsubscribeSignal.call(signal, onabort)
        : signal.removeEventListener('abort', onabort);
    });
    signals = null;
  };

  signals.forEach((signal) => {
    if (aborted) {
      return;
    }

    if (signal.aborted) {
      onabort.call(signal);
      return;
    }

    signal.addEventListener('abort', onabort, { once: true });
  });

  const { signal } = controller;

  signal.unsubscribe = () => utils.asap(unsubscribe);

  return signal;
};

export default composeSignals;
