import CanceledError from "../cancel/CanceledError.js";
import utils from "../utils.js";

export default (signal, onAbort) => {
  let unsubscribe;

  if (signal) {
    let listener = () => {
      onAbort(CanceledError.from(signal.reason));
    };

    if (signal.aborted) {
      utils.asap(listener)
    } else {
      unsubscribe = () => {
        if (signal) {
          signal.removeEventListener('abort', listener);
          unsubscribe = null;
        }
      }
      signal.addEventListener('abort', listener);
    }
  }

  return () => {
    unsubscribe && unsubscribe();
  }
};
