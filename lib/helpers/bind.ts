'use strict';

export default function bind(fn: Function, thisArg: any) {
  return function wrap() {
    return fn.apply(thisArg, arguments);
  };
};
