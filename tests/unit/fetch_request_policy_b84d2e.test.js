import { describe, it } from 'vitest';
import assert from 'assert';
import axios from '../../index.js';

const DEFAULTS = {
  cache: 'default',
  redirect: 'follow',
  referrer: 'about:client',
  referrerPolicy: '',
  mode: 'cors',
  integrity: '',
  keepalive: false,
  priority: 'auto',
  window: null,
};

const makeRuntime = (unsupportedDefaults = [], rejectExplicitCache = false) => {
  const requests = [];

  class RuntimeRequest extends Request {
    constructor(input, init) {
      const unsupported = unsupportedDefaults.some((key) => init?.[key] === DEFAULTS[key]);
      const explicitFailure = rejectExplicitCache && init?.cache === 'no-store';

      if (unsupported || explicitFailure) {
        throw new TypeError('request option is unsupported');
      }

      super(input, init);

      if (String(input).includes('example.com')) {
        requests.push({ input, init: { ...init } });
      }
    }
  }

  return {
    env: {
      Request: RuntimeRequest,
      fetch: () => Promise.resolve(new Response('ok')),
    },
    requests,
  };
};

const request = (runtime, options = {}) =>
  axios.get('https://example.com/resource', {
    adapter: 'fetch',
    env: runtime.env,
    ...options,
  });

describe('fetch adapter RequestInit compatibility', () => {
  it('retains accepted defaults when one adapter default is unsupported', async () => {
    const runtime = makeRuntime(['cache']);
    const response = await request(runtime);

    assert.strictEqual(response.data, 'ok');
    const init = runtime.requests.at(-1).init;

    assert.strictEqual(init.cache, undefined);

    for (const [key, value] of Object.entries(DEFAULTS)) {
      if (key === 'cache') continue;
      assert.deepStrictEqual(init[key], value);
    }
  });

  it.each(Object.keys(DEFAULTS))(
    'omits only an unsupported adapter default for %s',
    async (unsupportedKey) => {
      const runtime = makeRuntime([unsupportedKey]);
      const response = await request(runtime);

      assert.strictEqual(response.data, 'ok');
      const init = runtime.requests.at(-1).init;
      assert.strictEqual(init[unsupportedKey], undefined);

      const supportedKey = unsupportedKey === 'redirect' ? 'cache' : 'redirect';
      assert.deepStrictEqual(init[supportedKey], DEFAULTS[supportedKey]);
    }
  );

  it('handles several unsupported defaults without discarding supported defaults', async () => {
    const runtime = makeRuntime(['cache', 'priority', 'window']);
    const response = await request(runtime);

    assert.strictEqual(response.data, 'ok');
    const init = runtime.requests.at(-1).init;
    assert.strictEqual(init.cache, undefined);
    assert.strictEqual(init.priority, undefined);
    assert.strictEqual(init.window, undefined);
    assert.strictEqual(init.redirect, 'follow');
    assert.strictEqual(init.mode, 'cors');
  });

  it('preserves explicit values even when they replace unsupported defaults', async () => {
    const runtime = makeRuntime(['cache', 'priority', 'redirect']);
    const response = await request(runtime, {
      fetchOptions: {
        cache: 'no-store',
        priority: 'high',
      },
    });

    assert.strictEqual(response.data, 'ok');
    const init = runtime.requests.at(-1).init;
    assert.strictEqual(init.cache, 'no-store');
    assert.strictEqual(init.priority, 'high');
  });

  it('keeps Axios-owned request fields authoritative', async () => {
    const runtime = makeRuntime(['cache']);
    const response = await axios.post('https://example.com/resource', 'payload', {
      adapter: 'fetch',
      env: runtime.env,
      withCredentials: true,
      fetchOptions: {
        method: 'GET',
        body: 'wrong body',
        headers: { 'X-Caller': 'wrong' },
        credentials: 'omit',
        duplex: 'full',
      },
    });

    assert.strictEqual(response.data, 'ok');
    const init = runtime.requests.at(-1).init;
    assert.strictEqual(init.method, 'POST');
    assert.strictEqual(init.body, 'payload');
    assert.strictEqual(init.duplex, 'half');
    assert.strictEqual(init.credentials, 'include');
    assert.strictEqual(init.headers['X-Caller'], undefined);
  });

  it('preserves manual redirect handling when the normal redirect default is unsupported', async () => {
    const runtime = makeRuntime(['redirect', 'cache']);
    const response = await request(runtime, { maxRedirects: 0 });

    assert.strictEqual(response.data, 'ok');
    assert.strictEqual(runtime.requests.at(-1).init.redirect, 'manual');
  });

  it('applies the compatibility policy to body-bearing requests', async () => {
    const runtime = makeRuntime(['cache', 'keepalive']);
    const response = await axios.post('https://example.com/resource', 'payload', {
      adapter: 'fetch',
      env: runtime.env,
    });

    assert.strictEqual(response.data, 'ok');
    const init = runtime.requests.at(-1).init;
    assert.strictEqual(init.body, 'payload');
    assert.strictEqual(init.cache, undefined);
    assert.strictEqual(init.keepalive, undefined);
  });

  it('does not silently remove an explicitly rejected option', async () => {
    const runtime = makeRuntime(['cache'], true);
    const response = await request(runtime);

    assert.strictEqual(response.data, 'ok');

    await assert.rejects(() =>
      request(runtime, { fetchOptions: { cache: 'no-store' } })
    );
  });
});
