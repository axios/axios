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
  [
    'cancellation-shaped plain object',
    { __CANCEL__: true, code: 'ERR_CANCELED', message: 'stop' },
    'stop',
  ],
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
  expect(error).toBeInstanceOf(axios.CanceledError);
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

  it('attaches the current config when the reason is a frozen cancellation error', async () => {
    const reason = Object.freeze(new axios.CanceledError('stop', { url: '/old' }));
    const controller = new AbortController();
    controller.abort(reason);
    const dispatch = vi.fn();
    const error = await axios
      .get('http://localhost/current', { signal: controller.signal, adapter: dispatch })
      .catch((error) => error);

    expectCancellation(error, reason, 'stop');
    expect(error.config.url).toBe('http://localhost/current');
    expect(dispatch).not.toHaveBeenCalled();
  });
});

describe.each(['http', 'fetch'])('%s AbortSignal reasons', (adapter) => {
  it.each([
    ['mutable', false, false],
    ['frozen', true, false],
    ['frozen with a cause', true, true],
  ])(
    'attaches current context to a %s cancellation reason in the direct adapter',
    async (label, frozen, hasCause) => {
      const reason = new axios.CanceledError('stop', { url: '/old' }, { old: true });
      const cause = new Error('original');
      if (hasCause) reason.cause = cause;
      if (frozen) Object.freeze(reason);
      const controller = new AbortController();
      let received;
      const requestReceived = new Promise((resolve) => {
        received = resolve;
      });
      const server = await startHTTPServer(() => received());

      try {
        const config = {
          url: `http://localhost:${server.address().port}/current`,
          method: 'get',
          signal: controller.signal,
        };
        const result = axios
          .getAdapter(adapter)(config)
          .catch((error) => error);
        await withinDeadline(requestReceived);
        controller.abort(reason);
        const error = await withinDeadline(result);

        expect(error).toBeInstanceOf(axios.CanceledError);
        expect(error.code).toBe('ERR_CANCELED');
        expect(error.message).toBe('stop');
        expect(error.config).toBe(config);
        expect(error.request).toBeTruthy();
        expect(error.request).not.toEqual({ old: true });
        if (frozen) {
          expect(error).not.toBe(reason);
          expect(error.cause).toBe(hasCause ? cause : reason);
          expect(Object.getOwnPropertyDescriptor(error, 'cause').enumerable).toBe(false);
          expect(reason.config.url).toBe('/old');
        } else {
          expect(error).toBe(reason);
        }
      } finally {
        controller.abort();
        await stopHTTPServer(server);
      }
    }
  );

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
