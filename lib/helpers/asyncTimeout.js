import listenToSignal from "./listenToSignal.js";

export default (ms, signal) => new Promise((resolve, reject) => {
  let timeout, unsubscribe, onAbort;

  onAbort = (err) => {
    timeout && clearTimeout(timeout);
    reject(err);
  }

  unsubscribe = listenToSignal(signal, (err) => {
    onAbort(err);
  });

  timeout = setTimeout(() => {
    unsubscribe();
    resolve();
  }, ms);
});

