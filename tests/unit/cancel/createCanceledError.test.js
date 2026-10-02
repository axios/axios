import { describe, expect, it } from 'vitest';
import vm from 'node:vm';
import axios from '../../../index.js';
import createCanceledError from '../../../lib/cancel/createCanceledError.js';

const revoked = Proxy.revocable({}, {});
revoked.revoke();

const throwingMessage = Object.defineProperty({}, 'message', {
  get() {
    throw new Error('unreadable message');
  },
});

const throwingConversion = {
  [Symbol.toPrimitive]() {
    throw new Error('cannot convert');
  },
};

describe('cancel::createCanceledError', () => {
  it.each([
    ['foreign Error', vm.runInNewContext('new Error("foreign")'), 'foreign'],
    ['throwing message getter', throwingMessage, 'canceled'],
    ['throwing conversion', throwingConversion, 'canceled'],
    ['null-prototype object', Object.create(null), 'canceled'],
    ['revoked proxy', revoked.proxy, 'canceled'],
    ['missing reason', undefined, 'canceled'],
    [
      'malformed cancellation object',
      { __CANCEL__: true, code: 'ERR_CANCELED', message: 0 },
      'canceled',
    ],
  ])('handles %s without interrupting cancellation', (label, reason, message) => {
    const error = createCanceledError(reason);
    expect(axios.isCancel(error)).toBe(true);
    expect(error.code).toBe('ERR_CANCELED');
    expect(error.message).toBe(message);
    expect(error.cause).toBe(reason);
    expect(() => JSON.stringify(error.toJSON())).not.toThrow();
  });

  it('keeps existing cancellation errors and their original cause', () => {
    const reason = new axios.CanceledError('already canceled');
    reason.cause = new Error('original');
    expect(createCanceledError(reason)).toBe(reason);
  });

  it('uses the default AbortController reason and its message', () => {
    const controller = new AbortController();
    controller.abort();
    const error = createCanceledError(controller.signal.reason);
    expect(error.message).toBe(controller.signal.reason.message);
    expect(error.cause).toBe(controller.signal.reason);
  });
});
