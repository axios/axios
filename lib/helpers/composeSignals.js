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

  const onTimeout = () => {
    timer = null;
    onabort(new AxiosError(`timeout of ${timeout}ms exceeded`, AxiosError.ETIMEDOUT));
  };

  if (timeout > 0x7fffffff) {
    // Timers overflow above the signed 32-bit delay limit and fire almost at once, so wait in
    // steps and measure each one against the deadline, which a late callback cannot push back.
    const now =
      typeof performance !== 'undefined' && utils.isFunction(performance.now)
        ? () => performance.now()
        : Date.now;
    const deadline = now() + Number(timeout);
    const scheduleTimeout = () => {
      const remaining = deadline - now();
      if (remaining > 0x7fffffff) {
        timer = setTimeout(scheduleTimeout, 0x7fffffff);
      } else if (remaining > 0) {
        timer = setTimeout(onTimeout, remaining);
      } else {
        onTimeout();
      }
    };
    scheduleTimeout();
  } else if (timeout) {
    timer = setTimeout(onTimeout, timeout);
  }

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
