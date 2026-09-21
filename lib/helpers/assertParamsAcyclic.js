import utils from '../utils.js';
import AxiosError from '../core/AxiosError.js';

export default function assertParamsAcyclic(params) {
  const pending = [{ value: params }];
  const active = new WeakSet();
  const visited = new WeakSet();

  while (pending.length) {
    const { value, done } = pending.pop();
    if (!utils.isPlainObject(value) && !utils.isArray(value)) continue;
    if (done) {
      active.delete(value);
      continue;
    }
    if (active.has(value)) {
      throw new AxiosError(
        'Circular reference detected in params',
        AxiosError.ERR_BAD_OPTION_VALUE
      );
    }
    if (visited.has(value)) continue;
    visited.add(value);
    active.add(value);
    pending.push({ value, done: true });

    const keys = Object.keys(value).concat(
      Object.getOwnPropertySymbols(value).filter((key) => {
        const descriptor = Object.getOwnPropertyDescriptor(value, key);
        return descriptor && descriptor.enumerable;
      })
    );
    keys.forEach((key) => {
      if (key !== '__proto__' && key !== 'constructor' && key !== 'prototype') {
        pending.push({ value: value[key] });
      }
    });
  }
}
