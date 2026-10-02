import { describe, expect, it, vi } from 'vitest';
import axios from '../../../index.js';
import { startHTTPServer, stopHTTPServer } from '../../setup/server.js';

const reasons = [
  ['Symbol', Symbol('stop'), 'Symbol(stop)'],
  ['BigInt', BigInt(1), '1'],
  ['zero', 0, '0'],
  ['false', false, 'false'],
  ['empty string', '', ''],
  ['null', null, 'canceled'],
  ['object', { operation: 'stop' }, 'canceled'],
  ['Error', new Error('stop'), 'stop'],
  ['AxiosError', new axios.AxiosError('stop', 'ERR_BAD_REQUEST'), 'stop'],
];

const withinDeadline = async (promise) => {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((resolve, reject) => {
        timer = setTimeout(() => reject(new Error('Cancellation did not finish')), 1500);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
};

const expectCancellation = (error, reason, message) => {
  expect(axios.isCancel(error)).toBe(true);
  expect(error.code).toBe('ERR_CANCELED');
  expect(error.message).toBe(message);
  expect(error.cause).toBe(reason);
  expect(Object.getOwnPropertyDescriptor(error, 'cause').enumerable).toBe(false);
  expect(() => JSON.stringify(error.toJSON())).not.toThrow();
};

describe('AbortSignal before dispatch', () => {
  it.each(reasons)('normalizes %s before dispatch', async (label, reason, message) => {
    const controller = new AbortController();
    controller.abort(reason);
    const dispatch = vi.fn();
    const error = await axios
      .get('http://localhost/', {
        signal: controller.signal,
        adapter: dispatch,
      })
      .catch((error) => error);

    expectCancellation(error, reason, message);
    expect(error.config.url).toBe('http://localhost/');
    expect(dispatch).not.toHaveBeenCalled();
  });
});

describe.each(['http', 'fetch'])('%s AbortSignal reasons', (adapter) => {
  it.each(reasons)(
    'cancels an active request with %s and closes its connection',
    async (label, reason, message) => {
      const controller = new AbortController();
      const add = vi.spyOn(controller.signal, 'addEventListener');
      const remove = vi.spyOn(controller.signal, 'removeEventListener');
      let received;
      let closed;
      const requestReceived = new Promise((resolve) => {
        received = resolve;
      });
      const connectionClosed = new Promise((resolve) => {
        closed = resolve;
      });
      const server = await startHTTPServer((req, res) => {
        res.once('close', closed);
        received();
        // Keep the response pending: cancellation must close the connection itself.
      });

      try {
        const url = `http://localhost:${server.address().port}/`;
        const result = axios
          .get(url, { adapter, signal: controller.signal })
          .catch((error) => error);
        await withinDeadline(requestReceived);
        controller.abort(reason);
        const error = await withinDeadline(result);

        expectCancellation(error, reason, message);
        expect(error.config.url).toBe(url);
        expect(error.request).toBeTruthy();
        await withinDeadline(connectionClosed);
        for (const [type, listener] of add.mock.calls) {
          if (type === 'abort') {
            expect(remove.mock.calls.some((call) => call[0] === type && call[1] === listener)).toBe(
              true
            );
          }
        }
      } finally {
        controller.abort();
        await stopHTTPServer(server);
        vi.restoreAllMocks();
      }
    }
  );
});

describe('HTTP response stream abort reasons', () => {
  it.each(reasons)(
    'classifies %s as cancellation after response delivery',
    async (label, reason, message) => {
      const server = await startHTTPServer((req, res) => {
        res.writeHead(200);
        res.write('first chunk');
      });
      const controller = new AbortController();

      try {
        const response = await axios.get(`http://localhost:${server.address().port}/`, {
          adapter: 'http',
          responseType: 'stream',
          signal: controller.signal,
        });
        const failed = new Promise((resolve) => response.data.once('error', resolve));
        controller.abort(reason);
        const error = await withinDeadline(failed);
        expectCancellation(error, reason, message);
        expect(error.config).toBe(response.config);
        expect(error.request).toBeTruthy();
        expect(response.data.destroyed).toBe(true);
      } finally {
        controller.abort();
        await stopHTTPServer(server);
      }
    }
  );
});
