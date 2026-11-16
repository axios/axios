import { describe, it, expect, vi } from 'vitest';
import axios from '../../../index.js';
import AxiosError from '../../../lib/core/AxiosError.js';

const makeAdapter = () =>
  vi.fn(async (config) => ({ config, data: 'ok', status: 200, statusText: 'OK', headers: {} }));

describe('progressUpdateIntervalMs', () => {
  it.each([0, -1, 0.5, NaN, Infinity, -Infinity, 2147483648, '50', null, true, {}, []])(
    'rejects invalid intervals before dispatch: %j',
    async (progressUpdateIntervalMs) => {
      const adapter = makeAdapter();
      await expect(axios({ url: '/foo', adapter, progressUpdateIntervalMs })).rejects.toMatchObject(
        {
          code: AxiosError.ERR_BAD_OPTION_VALUE,
        }
      );
      expect(adapter).not.toHaveBeenCalled();
    }
  );

  it.each([undefined, 1, 1.5, 50, 1000, 2147483647])('accepts interval %j', async (interval) => {
    const adapter = makeAdapter();
    await axios({ url: '/foo', adapter, progressUpdateIntervalMs: interval });
    expect(adapter).toHaveBeenCalledOnce();
  });

  it('supports instance defaults and per-request overrides without mutating defaults', async () => {
    const adapter = makeAdapter();
    const instance = axios.create({ adapter, progressUpdateIntervalMs: 1000 });
    await instance.get('/foo');
    await instance.get('/foo', { progressUpdateIntervalMs: 50 });
    expect(adapter.mock.calls[0][0].progressUpdateIntervalMs).toBe(1000);
    expect(adapter.mock.calls[1][0].progressUpdateIntervalMs).toBe(50);
    expect(instance.defaults.progressUpdateIntervalMs).toBe(1000);
  });

  it('ignores a progress interval inherited from Object.prototype', async () => {
    const original = Object.getOwnPropertyDescriptor(Object.prototype, 'progressUpdateIntervalMs');
    Object.defineProperty(Object.prototype, 'progressUpdateIntervalMs', {
      configurable: true,
      writable: true,
      value: -1,
    });
    try {
      const adapter = makeAdapter();
      await axios({ url: '/foo', adapter });
      expect(Object.hasOwn(adapter.mock.calls[0][0], 'progressUpdateIntervalMs')).toBe(false);
    } finally {
      if (original) Object.defineProperty(Object.prototype, 'progressUpdateIntervalMs', original);
      else delete Object.prototype.progressUpdateIntervalMs;
    }
  });
});
