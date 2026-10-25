import utils from '../utils.js';

const callbackify = (fn, reducer) => {
  if (!utils.isFunction(fn)) return fn;

  return function (...args) {
    const cb = args.pop();
    let called = false;
    const onceCb = (...cbArgs) => {
      if (called) return;
      called = true;
      cb(...cbArgs);
    };

    let ret;
    try {
      ret = fn.apply(this, args.concat(onceCb));
    } catch (err) {
      return onceCb(err);
    }

    if (utils.isThenable(ret)) {
      ret.then((value) => {
        try {
          reducer ? onceCb(null, ...reducer(value)) : onceCb(null, value);
        } catch (err) {
          onceCb(err);
        }
      }, onceCb);
    }
  };
};

export default callbackify;
