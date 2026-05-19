import CanceledError from '../cancel/CanceledError.js';
import AxiosError from '../core/AxiosError.js';
import utils from '../utils.js';

const composeSignals = (signals, timeout, options) => {
  const { timeoutErrorMessage, transitional } = options || {};

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

  let timer =
    timeout &&
    setTimeout(() => {
      timer = null;
      // Mirror the xhr/http adapters so identical config produces identical
      // timeout errors across every adapter: ECONNABORTED by default,
      // ETIMEDOUT only when transitional.clarifyTimeoutError is set, and
      // timeoutErrorMessage overrides the default text.
      onabort(
        new AxiosError(
          timeoutErrorMessage || `timeout of ${timeout}ms exceeded`,
          transitional && transitional.clarifyTimeoutError
            ? AxiosError.ETIMEDOUT
            : AxiosError.ECONNABORTED
        )
      );
    }, timeout);

  const unsubscribe = () => {
    if (!signals) { return; }
    timer && clearTimeout(timer);
    timer = null;
    signals.forEach((signal) => {
      signal.unsubscribe
        ? signal.unsubscribe(onabort)
        : signal.removeEventListener('abort', onabort);
    });
    signals = null;
  };

  signals.forEach((signal) => signal.addEventListener('abort', onabort));

  const { signal } = controller;

  signal.unsubscribe = () => utils.asap(unsubscribe);

  return signal;
};

export default composeSignals;
