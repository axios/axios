import listenToSignal from "./listenToSignal.js";

export default (ms, signal) => new Promise((resolve, reject) => {
  let timeout;
  let unsubscribe = listenToSignal(signal, (err) => {
    timeout && clearTimeout(timeout);
    reject(err);
  });

  timeout = setTimeout(() => {
    unsubscribe();
    resolve();
  }, ms);

  return () =>{
    timeout && clearTimeout(timeout);
    unsubscribe();
  };
});
