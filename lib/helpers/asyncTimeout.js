import CanceledError from "../cancel/CanceledError.js";

export default (ms, signal) => new Promise((resolve, reject) => {
  let onabort;
  let unsubscribe;

  let timer = setTimeout(() => {
    unsubscribe && unsubscribe();
    resolve();
  });

  if (signal) {
    unsubscribe = () => {
      signal.removeListener('abort', onabort);
      unsubscribe = null;
    };

    signal.addEventListener('abort', onabort = (() => {
      clearTimeout(timer);
      timer = null;
      unsubscribe();
      reject(new CanceledError());
    }));
  }
});
