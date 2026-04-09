import { describe, expect, it } from 'vitest';

import { EventEmitter } from 'events';
import axios from 'axios';

const createPendingTransport = () => {
  let requestCount = 0;

  const transport = {
    request() {
      requestCount += 1;

      const req = new EventEmitter();
      req.destroyed = false;
      req.setTimeout = () => {};
      req.write = () => true;
      req.end = () => {};
      req.destroy = () => {
        req.destroyed = true;
      };
      req.close = req.destroy;

      return req;
    },
  };

  return {
    transport,
    getRequestCount: () => requestCount,
  };
};

describe('cancel compat (dist export only)', () => {
  it('supports cancellation with AbortController (pre-aborted signal)', async () => {
    const { transport, getRequestCount } = createPendingTransport();
    const controller = new AbortController();
    controller.abort();

    try {
      const request = axios.get('http://example.com/resource', {
        signal: controller.signal,
        transport,
        proxy: false,
      });

      controller.abort();
      await request;
    } catch (error) {
      expect(error.code).toBe('ERR_CANCELED');
    }

    expect(getRequestCount()).toBe(0);
  });

  it('supports cancellation with AbortController (in-flight)', async () => {
    const { transport, getRequestCount } = createPendingTransport();
    const controller = new AbortController();

    try {
      const request = axios.get('http://example.com/resource', {
        signal: controller.signal,
        transport,
        proxy: false,
      });

      controller.abort();
      await request;
    } catch (error) {
      expect(error.code).toBe('ERR_CANCELED');
    }

    expect(getRequestCount()).toBe(1);
  });

  it('supports cancellation with CancelToken (pre-canceled token)', async () => {
    const { transport, getRequestCount } = createPendingTransport();
    const source = axios.CancelToken.source();
    source.cancel('Operation canceled by the user.');

    const error = await axios
      .get('http://example.com/resource', {
        cancelToken: source.token,
        transport,
        proxy: false,
      })
      .catch((err) => err);

    expect(axios.isCancel(error)).toBe(true);
    expect(error.code).toBe('ERR_CANCELED');
    expect(getRequestCount()).toBe(0);
  });

  it('supports cancellation with CancelToken (in-flight)', async () => {
    const { transport, getRequestCount } = createPendingTransport();
    const source = axios.CancelToken.source();

    const request = axios.get('http://example.com/resource', {
      cancelToken: source.token,
      transport,
      proxy: false,
    });

    source.cancel('Operation canceled by the user.');

    const error = await request.catch((err) => err);

    expect(axios.isCancel(error)).toBe(true);
    expect(error.code).toBe('ERR_CANCELED');
    expect(getRequestCount()).toBe(1);
  });
});
