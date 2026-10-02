'use strict';

import createCanceledError from './createCanceledError.js';
import AxiosError from '../core/AxiosError.js';
import utils from '../utils.js';

const composeSignals = (signals, timeout) => {
  signals = signals ? signals.filter(Boolean) : [];

  if (!timeout && !signals.length) {
    return;
  }

  const controller = new AbortController();

  let aborted = false;

  const abort = (reason) => {
    if (!aborted) {
      aborted = true;
      unsubscribe();
      controller.abort(reason);
    }
  };

  const onabort = function () {
    abort(createCanceledError(this.reason));
  };

  let timer =
    timeout &&
    setTimeout(() => {
      timer = null;
      abort(new AxiosError(`timeout of ${timeout}ms exceeded`, AxiosError.ETIMEDOUT));
    }, timeout);

  const unsubscribe = () => {
    if (!signals) {
      return;
    }
    timer && clearTimeout(timer);
    timer = null;
    signals.forEach((signal) => {
      signal.unsubscribe
        ? signal.unsubscribe(onabort)
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
