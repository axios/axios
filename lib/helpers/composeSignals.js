import CanceledError from "../cancel/CanceledError.js";
import AxiosError from "../core/AxiosError.js";

const composeSignals = (signals, timeout) => {
  let controller = new AbortController();

  let aborted;

  const onabort = function (cancel) {
    if (!aborted) {
      aborted = true;
      unsubscribe();
      const err = cancel instanceof Error ? cancel : this.reason;
      controller.abort(err instanceof AxiosError ? err : new CanceledError(err instanceof Error ? err.message : err));
    }
  }

  let timer = timeout && setTimeout(() => {
    onabort(new AxiosError(`timeout ${timeout} of ms exceeded`, AxiosError.ETIMEDOUT))
  }, timeout)

  const unsubscribe = () => {
    if (signals) {
      timer && clearTimeout(timer);
      timer = null;
      signals.forEach(signal => {
        signal &&
        (signal.removeEventListener ? signal.removeEventListener('abort', onabort) : signal.unsubscribe(onabort));
      });
      signals = null;
    }
  }

  signals.forEach((signal) => signal && signal.addEventListener && signal.addEventListener('abort', onabort));

  const {signal} = controller;

  signal.unsubscribe = unsubscribe;

  return [signal, () => {
    timer && clearTimeout(timer);
    timer = null;
  }];
}

export default composeSignals;
