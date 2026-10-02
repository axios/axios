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
      'cancellation-shaped plain object',
      { __CANCEL__: true, code: 'ERR_CANCELED', message: 'stop' },
      'stop',
    ],
    [
      'malformed cancellation object',
      { __CANCEL__: true, code: 'ERR_CANCELED', message: 0 },
      'canceled',
    ],
  ])('handles %s without interrupting cancellation', (label, reason, message) => {
    const error = createCanceledError(reason);
    expect(error).toBeInstanceOf(axios.CanceledError);
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
    expect(Object.getOwnPropertyDescriptor(reason, 'cause').enumerable).toBe(false);
  });

  it('updates the request context of a reusable cancellation error', () => {
    const reason = new axios.CanceledError('stop', { url: '/old' }, { old: true });
    const config = { url: '/current' };
    const request = { current: true };

    const error = createCanceledError(reason, config, request);

    expect(error).toBe(reason);
    expect(error.config).toBe(config);
    expect(error.request).toBe(request);
  });

  it.each([false, true])('copies a frozen cancellation error (existing cause: %s)', (hasCause) => {
    const reason = new axios.CanceledError('stop', { url: '/old' }, { old: true });
    const cause = new Error('original');
    if (hasCause) reason.cause = cause;
    Object.freeze(reason);
    const config = { url: '/current' };
    const request = { current: true };

    const error = createCanceledError(reason, config, request);

    expect(error).toBeInstanceOf(axios.CanceledError);
    expect(error).not.toBe(reason);
    expect(error.message).toBe('stop');
    expect(error.config).toBe(config);
    expect(error.request).toBe(request);
    expect(error.cause).toBe(hasCause ? cause : reason);
    expect(Object.getOwnPropertyDescriptor(error, 'cause').enumerable).toBe(false);
    expect(reason.config.url).toBe('/old');
    expect(reason.request).toEqual({ old: true });
  });

  it('copies an error whose enumerable cause cannot be reconfigured', () => {
    const reason = new axios.CanceledError('stop');
    const cause = { circular: null };
    cause.circular = cause;
    Object.defineProperty(reason, 'cause', { value: cause, enumerable: true });

    const error = createCanceledError(reason);

    expect(error).not.toBe(reason);
    expect(error.cause).toBe(cause);
    expect(Object.getOwnPropertyDescriptor(error, 'cause').enumerable).toBe(false);
    expect(() => JSON.stringify(Object.fromEntries(Object.entries(error)))).not.toThrow();
  });

  it('uses the default AbortController reason and its message', () => {
    const controller = new AbortController();
    controller.abort();
    const error = createCanceledError(controller.signal.reason);
    expect(error.message).toBe(controller.signal.reason.message);
    expect(error.cause).toBe(controller.signal.reason);
  });
});
