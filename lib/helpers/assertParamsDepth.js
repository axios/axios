import utils from '../utils.js';
import AxiosError from '../core/AxiosError.js';

export default function assertParamsDepth(params) {
  const pending = [{ value: params, depth: 0 }];
  const visited = new WeakMap();
  while (pending.length) {
    const { value, depth } = pending.pop();
    if (!utils.isPlainObject(value) && !utils.isArray(value)) {
      continue;
    }
    if (depth > 100) {
      throw new AxiosError(
        'params exceed the maximum depth of 100',
        AxiosError.ERR_BAD_OPTION_VALUE
      );
    }
    if (visited.has(value) && visited.get(value) >= depth) continue;
    visited.set(value, depth);
    const keys = Object.keys(value).concat(
      Object.getOwnPropertySymbols(value).filter(
        (key) => Object.getOwnPropertyDescriptor(value, key).enumerable
      )
    );
    keys.forEach((key) => {
      if (key !== '__proto__' && key !== 'constructor' && key !== 'prototype') {
        pending.push({ value: value[key], depth: depth + 1 });
      }
    });
  }
}
