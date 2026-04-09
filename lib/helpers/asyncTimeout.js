import CanceledError from "../cancel/CanceledError.js";

export default (ms, signal) => new Promise((resolve, reject) => {
  let onabort;
  let unsubscribe;

  if (signal && signal.aborted) {
    return reject(CanceledError.from(signal.reason));
  }

  let timer = setTimeout(() => {
    unsubscribe && unsubscribe();
    resolve();
  }, ms);

  if (signal) {
    unsubscribe = () => {
      signal.removeEventListener('abort', onabort);
      unsubscribe = null;
    };

    signal.addEventListener('abort', onabort = (() => {
      clearTimeout(timer);
      timer = null;
      unsubscribe();
      reject(CanceledError.from(signal.reason));
    }));
  }
});
