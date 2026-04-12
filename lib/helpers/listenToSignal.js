import CanceledError from "../cancel/CanceledError.js";
import utils from "../utils.js";


export default (signal, onAbort) => {
  let listener, unsubscribe = () => {
    signal && signal.removeEventListener('abort', listener);
    signal = null;
  };

  if (signal) {
    listener = () => {
      let {reason} = signal;
      unsubscribe();
      onAbort(CanceledError.from(reason));
    }

    if (signal) {
      signal.aborted ? utils.asap(listener) : signal.addEventListener('abort', listener);
    }
  }

  return unsubscribe;
}
