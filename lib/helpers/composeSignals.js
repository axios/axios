import CanceledError from '../cancel/CanceledError.js';
import AxiosError from '../core/AxiosError.js';
import utils from '../utils.js';

const composeSignals = (signals, timeout) => {
  const { length } = (signals = signals ? signals.filter(Boolean) : []);

  if (timeout || length) {
    let controller = new AbortController();

    let aborted;

    const onabort = (reason) => {
      if (!aborted) {
        aborted = true;
        unsubscribe();
        const err = reason instanceof Error ? reason : reason;
        controller.abort(
          err instanceof AxiosError
            ? err
            : new CanceledError(
                err instanceof Error ? err.message : err,
                undefined,
                undefined,
                err instanceof Error ? err : undefined
              )
        );
      }
    };

    let timer =
      timeout &&
      setTimeout(() => {
        timer = null;
        onabort(new AxiosError(`timeout of ${timeout}ms exceeded`, AxiosError.ETIMEDOUT));
      }, timeout);

    const unsubscribe = () => {
      if (signals) {
        timer && clearTimeout(timer);
        timer = null;
        signals.forEach((signal) => {
          signal.unsubscribe
            ? signal.unsubscribe(onabort)
            : signal.removeEventListener('abort', onabort);
        });
        signals = null;
      }
    };

    signals.forEach((signal) => {
      signal.addEventListener('abort', () => onabort(signal.reason));
    });

    const { signal } = controller;

    signal.unsubscribe = () => utils.asap(unsubscribe);

    return signal;
  }
};

export default composeSignals;
