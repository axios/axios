import CanceledError from "../cancel/CanceledError.js";
import AxiosError from "../core/AxiosError.js";
import utils from '../utils.js';

const composeSignals = (signals, timeout) => {
  const { length } = (signals = signals ? signals.filter(Boolean) : []);

  if (timeout || length) {
    if (AbortSignal.any) {
      const controller = new AbortController();
      let timer;

      const onAbort = () => {
        timer && clearTimeout(timer);
        timer = null;
      }

      let timeoutSignal;

      if (timeout) {
        timer = setTimeout(() => {
          onAbort();
          controller.abort(new AxiosError(`timeout of ${timeout}ms exceeded`, AxiosError.ETIMEDOUT));
        }, timeout);
        timeoutSignal = controller.signal;
      }

      const compositeSignal = AbortSignal.any([...signals, ...(timeoutSignal ? [timeoutSignal] : [])]);

      if (timeout) {
        compositeSignal.unsubscribe = () => {
          utils.asap(onAbort);
        }
      }

      return compositeSignal;
    }

    let controller = new AbortController();

    let aborted;

    const onabort = function (reason) {
      if (!aborted) {
        aborted = true;
        unsubscribe();
        const err = reason instanceof Error ? reason : this.reason;
        controller.abort(err instanceof AxiosError ? err : new CanceledError(err instanceof Error ? err.message : err));
      }
    }

    let timer = timeout && setTimeout(() => {
      timer = null;
      onabort(new AxiosError(`timeout of ${timeout}ms exceeded`, AxiosError.ETIMEDOUT))
    }, timeout)

    const unsubscribe = () => {
      if (signals) {
        timer && clearTimeout(timer);
        timer = null;
        signals.forEach(signal => {
          signal.unsubscribe ? signal.unsubscribe(onabort) : signal.removeEventListener('abort', onabort);
        });
        signals = null;
      }
    }

    signals.forEach((signal) => signal.addEventListener('abort', onabort));

    const { signal } = controller;

    signal.unsubscribe = () => utils.asap(unsubscribe);

    return signal;
  }
}

export default composeSignals;
