import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { realpathSync, readFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { Readable } from 'node:stream';
import http from 'node:http';
import https from 'node:https';

export async function register(test, esm) {
  const require = createRequire(import.meta.url);
  const mode = process.env.AXIOS_E2E_MODULE || 'esm';
  const runtime = process.env.AXIOS_E2E_RUNTIME;
  const module = mode === 'cjs' ? require('axios') : esm;
  const axios = mode === 'cjs' ? module : module.default;
  const info = JSON.parse(process.env.AXIOS_E2E_SERVICES);
  const origin = info.origin;
  const clientRoot = resolve(process.cwd(), 'node_modules/axios');
  const checkError = (code) => (error) => axios.isAxiosError(error) && error.code === code;
  test('installed release resolves inside the isolated consumer', async () => {
    const entry = realpathSync(require.resolve('axios'));
    assert.ok(entry.startsWith(realpathSync(clientRoot) + sep), entry);
    assert.equal(realpathSync(clientRoot), clientRoot);
    const metadata = require('axios/package.json');
    assert.equal(metadata.version, process.env.AXIOS_E2E_VERSION);
    assert.equal(axios.VERSION, metadata.version);
    assert.equal(typeof axios, 'function');
    for (const name of [
      'AxiosError',
      'CanceledError',
      'AxiosHeaders',
      'isCancel',
      'isAxiosError',
      'toFormData',
      'formToJSON',
      'getAdapter',
      'all',
      'spread',
    ]) {
      assert.equal(typeof axios[name], 'function', name);
      if (mode === 'esm')
        assert.equal(
          module[name],
          axios[name],
          `${name}: ${import.meta.resolve('axios')} exports ${Object.keys(module).join(', ')}`
        );
    }
    assert.equal((await axios.get(origin + '/echo', { proxy: false })).status, 200);
  });

  for (const adapter of ['http', 'fetch']) {
    const client = axios.create({ baseURL: origin, adapter, proxy: false, timeout: 4000 });
    const scenario = (name, run) => test(`${adapter}: ${name}`, run);
    for (const method of ['get', 'delete', 'head', 'options', 'post', 'put', 'patch']) {
      scenario(`${method.toUpperCase()} reaches a real service`, async () => {
        const body = ['post', 'put', 'patch'].includes(method)
          ? { name: 'widget', unicode: '世界' }
          : undefined;
        const response = await client.request({ url: '/echo?limit=10', method, data: body });
        assert.equal(response.status, method === 'options' ? 204 : 200);
        if (!['head', 'options'].includes(method)) {
          assert.equal(response.data.method, method.toUpperCase());
          if (body) assert.deepEqual(JSON.parse(response.data.body), body);
        }
      });
    }
    scenario('callable instances, defaults, header buckets and URL parameters', async () => {
      const isolated = axios.create({
        baseURL: origin,
        adapter,
        proxy: false,
        headers: { common: { 'X-Common': 'yes' }, post: { 'X-Post': 'only-post' } },
      });
      const response = await isolated({
        url: '/echo',
        method: 'post',
        params: { q: 'a b', tag: ['one', 'two'] },
        data: { ok: true },
        headers: { 'X-Request': 'yes' },
      });
      assert.equal(response.data.headers['x-common'], 'yes');
      assert.equal(response.data.headers['x-post'], 'only-post');
      assert.equal(response.data.headers['x-request'], 'yes');
      assert.equal(response.data.headers.common, undefined);
      assert.equal(new URL(response.data.url, origin).searchParams.get('q'), 'a b');
      assert.equal((await client.get('/echo')).data.headers['x-common'], undefined);
      assert.ok(isolated.getUri({ url: '/echo', params: { q: 'test' } }).includes('q=test'));
    });
    scenario('async request and response interceptors operate around the network', async () => {
      const chain = axios.create({ baseURL: origin, adapter, proxy: false });
      const order = [];
      chain.interceptors.request.use(async (config) => {
        order.push('first');
        config.headers.set('X-Token', 'test-token');
        return config;
      });
      chain.interceptors.request.use((config) => {
        order.push('second');
        return config;
      });
      const removed = chain.interceptors.request.use(() => {
        throw new Error('ejected interceptor ran');
      });
      chain.interceptors.request.eject(String(removed));
      chain.interceptors.response.use((res) => {
        order.push('response-one');
        return res;
      });
      chain.interceptors.response.use((res) => {
        order.push('response-two');
        res.data.transformed = true;
        return res;
      });
      const response = await chain.get('/echo');
      assert.deepEqual(order, ['second', 'first', 'response-one', 'response-two']);
      assert.equal(response.data.headers['x-token'], 'test-token');
      assert.equal(response.data.transformed, true);
    });
    scenario('a response interceptor refreshes authentication and retries a real 401', async () => {
      const session = axios.create({ baseURL: origin, adapter, proxy: false });
      session.interceptors.response.use(undefined, async (error) => {
        if (error.response?.status !== 401 || error.config.retried) throw error;
        await session.post('/echo', { refresh: 'test-refresh-token' });
        error.config.retried = true;
        error.config.headers.set('Authorization', 'Bearer refreshed');
        return session.request(error.config);
      });
      const response = await session.get('/protected');
      assert.equal(response.data.headers.authorization, 'Bearer refreshed');
    });
    scenario(
      'request transforms and header normalization affect the transmitted body',
      async () => {
        const response = await client.post(
          '/echo',
          { value: 42 },
          {
            transformRequest: [
              (value, headers) => {
                headers.set('Content-Type', 'text/plain');
                return `value=${value.value}`;
              },
            ],
            transformResponse: [(text) => ({ wrapped: JSON.parse(text) })],
            headers: { 'X-Case': 'first', 'x-case': 'last' },
          }
        );
        assert.equal(response.data.wrapped.body, 'value=42');
        assert.equal(response.data.wrapped.headers['x-case'], 'last');
      }
    );
    scenario(
      'URLSearchParams, object form encoding and custom parameter serialization',
      async () => {
        const response = await client.post(
          '/echo',
          new URLSearchParams({ name: 'a b', value: '+' }),
          { params: { ignored: 1 }, paramsSerializer: () => 'custom=yes' }
        );
        assert.equal(response.data.url, '/echo?custom=yes');
        assert.equal(new URLSearchParams(response.data.body).get('value'), '+');
        const object = await client.post(
          '/echo',
          { ids: [1, 2] },
          {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            formSerializer: { indexes: null },
          }
        );
        assert.deepEqual(new URLSearchParams(object.data.body).getAll('ids'), ['1', '2']);
      }
    );
    scenario('native multipart upload arrives as fields and binary files', async () => {
      const form = new FormData();
      form.append('name', 'café');
      form.append(
        'file',
        new Blob([new Uint8Array([0, 255, 128])], { type: 'application/octet-stream' }),
        'upload.bin'
      );
      const response = await client.post('/echo', form);
      assert.match(response.data.headers['content-type'], /^multipart\/form-data;.*boundary=/);
      assert.deepEqual(response.data.form, [
        ['name', 'café'],
        ['file', { name: 'upload.bin', type: 'application/octet-stream', bytes: [0, 255, 128] }],
      ]);
      const automatic = await client.postForm(
        '/echo',
        { name: 'automatic' },
        adapter === 'fetch' ? { env: { FormData } } : undefined
      );
      assert.deepEqual(automatic.data.form, [['name', 'automatic']]);
    });
    scenario('binary uploads and downloads preserve every byte', async () => {
      const bytes = Uint8Array.from([0, 255, 1, 128, 13, 10]);
      const uploaded = await client.post('/echo', bytes, {
        headers: { 'Content-Type': 'application/octet-stream' },
      });
      assert.deepEqual(uploaded.data.bytes, [...bytes]);
      const downloaded = await client.get('/binary', { responseType: 'arraybuffer' });
      assert.deepEqual([...new Uint8Array(downloaded.data)], [...bytes]);
    });
    scenario('JSON success and error bodies retain their public shapes', async () => {
      assert.deepEqual((await client.get('/json')).data, { ok: true });
      const text = await client.get('/json', { responseType: 'text' });
      assert.equal(typeof text.data, 'string');
      await assert.rejects(client.get('/status?code=503'), (error) => {
        assert.equal(error.response.status, 503);
        assert.deepEqual(error.response.data, { error: 'service unavailable' });
        assert.equal(error.toJSON().status, 503);
        return checkError('ERR_BAD_RESPONSE')(error);
      });
      assert.equal(
        (await client.get('/status?code=404', { validateStatus: (status) => status < 500 })).status,
        404
      );
      await assert.rejects(
        client.get('/json?invalid', {
          responseType: 'json',
          transitional: { silentJSONParsing: false },
        }),
        checkError('ERR_BAD_RESPONSE')
      );
    });
    scenario('Basic authentication overrides an explicit Authorization header', async () => {
      const response = await client.get('/echo', {
        auth: { username: 'user', password: 'pāss' },
        headers: { Authorization: 'Bearer replaced' },
      });
      assert.equal(
        response.data.headers.authorization,
        'Basic ' + Buffer.from('user:pāss').toString('base64')
      );
    });
    scenario('timeouts reject instead of resolving a stalled request', async () => {
      await assert.rejects(
        client.get('/slow', {
          timeout: 40,
          timeoutErrorMessage: 'service deadline',
          transitional: { clarifyTimeoutError: true },
        }),
        (error) => {
          assert.equal(error.message, 'service deadline');
          return checkError('ETIMEDOUT')(error);
        }
      );
    });
    scenario('pre-cancellation and legacy CancelToken reject', async () => {
      const controller = new AbortController();
      controller.abort('do not send');
      await assert.rejects(
        client.get('/echo', { signal: controller.signal }),
        checkError('ERR_CANCELED')
      );
      const source = axios.CancelToken.source();
      const request = client.get('/slow', { cancelToken: source.token });
      source.cancel('user canceled');
      await assert.rejects(
        request,
        (error) => axios.isCancel(error) && error.message === 'user canceled'
      );
    });
    scenario('uploads preserve bytes and download progress reaches the final byte', async () => {
      const uploads = [];
      const downloads = [];
      const payload = new Uint8Array(65536).fill(65);
      const response = await client.post('/echo', payload, {
        onUploadProgress: (event) => uploads.push(event.loaded),
      });
      assert.equal(response.data.bytes.length, payload.length);
      // Bun and Deno's Request implementations do not expose duplex, so Axios
      // does not advertise Fetch upload progress there. HTTP and Node Fetch do.
      if (adapter === 'http' || runtime === 'node') assert.equal(uploads.at(-1), payload.length);
      assert.equal(
        (
          await client.get('/stream', {
            responseType: 'text',
            onDownloadProgress: (event) => downloads.push(event.loaded),
          })
        ).data,
        'first\nsecond\nlast\n'
      );
      assert.equal(downloads.at(-1), 18);
    });
    scenario('redirects follow the real response and preserve a 307 body', async () => {
      const response = await client.post('/redirect?status=307', { redirected: true });
      assert.equal(response.data.method, 'POST');
      assert.deepEqual(JSON.parse(response.data.body), { redirected: true });
    });
    scenario('network connection failures become AxiosError', async () => {
      await assert.rejects(
        client.get('/reset'),
        (error) => axios.isAxiosError(error) && !error.response
      );
    });
    if (adapter === 'fetch') {
      scenario('Fetch abort reasons survive cancellation during a response body read', async () => {
        const controller = new AbortController();
        const response = await client.get('/pending', {
          responseType: 'stream',
          signal: controller.signal,
        });
        const reader = response.data.getReader();
        await reader.read();
        const pending = reader.read();
        controller.abort('consumer stopped');
        await assert.rejects(
          pending,
          (error) => error.code === 'ERR_CANCELED' && error.message === 'consumer stopped'
        );
        reader.releaseLock();
      });
      scenario(
        'Fetch streamed download cancellation settles a pending read with progress enabled',
        async () => {
          const response = await client.get('/pending', {
            responseType: 'stream',
            onDownloadProgress() {},
          });
          const reader = response.data.getReader();
          assert.equal(new TextDecoder().decode((await reader.read()).value), 'first\n');
          const pending = reader.read();
          await reader.cancel('consumer finished');
          assert.equal((await pending).done, true);
          reader.releaseLock();
        }
      );
      scenario('Fetch maxRedirects zero exposes the unfollowed response', async () => {
        const response = await client.get('/redirect', {
          maxRedirects: 0,
          validateStatus: () => true,
        });
        assert.equal(response.status, 302);
      });
      scenario('Fetch response and request size limits reject over the network', async () => {
        await assert.rejects(
          client.get('/binary', { maxContentLength: 2 }),
          checkError('ERR_BAD_RESPONSE')
        );
        await assert.rejects(
          client.post('/echo', 'over budget', { maxBodyLength: 2 }),
          checkError('ERR_BAD_REQUEST')
        );
      });
      scenario('Fetch releases a still-open response rejected by its declared length', async () => {
        const key = `oversize-${runtime}-${mode}`;
        await assert.rejects(
          client.get('/oversize?' + key, { maxContentLength: 1 }),
          checkError('ERR_BAD_RESPONSE')
        );
        let closed = false;
        for (let attempt = 0; attempt < 100; attempt++) {
          const records = (await client.get('/records')).data;
          closed = records.find((record) => record.url === '/oversize?' + key)?.closed;
          if (closed) break;
          await new Promise((done) => setTimeout(done, 10));
        }
        assert.equal(closed, true, 'the server-side connection must close after rejection');
      });
    }
  }
  // HTTP/2, Node agents, proxy configuration, and Node streams are Node's
  // public transport surface. Other runtimes still execute HTTP and Fetch above.
  if (runtime !== 'node') return;
  const client = axios.create({ baseURL: origin, adapter: 'http', proxy: false, timeout: 4000 });
  test('HTTP redirect strips credentials on a different origin', async () => {
    const target = info.other + '/echo';
    const res = await client.get('/redirect?to=' + encodeURIComponent(target), {
      headers: { Authorization: 'Bearer e2e-secret', Cookie: 'private=yes', 'X-Api-Key': 'key' },
      sensitiveHeaders: ['X-Api-Key'],
    });
    assert.equal(res.data.headers.authorization, undefined);
    assert.equal(res.data.headers.cookie, undefined);
    assert.equal(res.data.headers['x-api-key'], undefined);
  });
  test('HTTP same-origin 303 keeps authentication while rewriting POST to GET', async () => {
    const response = await client.post(
      '/redirect?status=303',
      {},
      { auth: { username: 'user', password: 'pass' } }
    );
    assert.equal(response.data.method, 'GET');
    assert.equal(response.data.headers.authorization, 'Basic dXNlcjpwYXNz');
  });
  test('HTTP redirect limits and beforeRedirect rejection prevent dispatch', async () => {
    await assert.rejects(
      client.get('/loop', { maxRedirects: 2 }),
      checkError('ERR_FR_TOO_MANY_REDIRECTS')
    );
    await assert.rejects(
      client.get('/redirect', {
        beforeRedirect() {
          throw new Error('policy denied');
        },
      }),
      /policy denied/
    );
  });
  for (const encoding of ['gzip', 'deflate', 'br'])
    test(`HTTP decompresses ${encoding} and applies limits after decompression`, async () => {
      assert.equal(
        (await client.get('/compressed?encoding=' + encoding)).data.message,
        'compressed response'
      );
      await assert.rejects(
        client.get('/compressed?encoding=' + encoding, { maxContentLength: 64 }),
        checkError('ERR_BAD_RESPONSE')
      );
    });
  test('HTTP Node streams upload, download and cancellation use actual sockets', async () => {
    const response = await client.post('/echo', Readable.from(['hello ', 'stream']), {
      headers: { 'Content-Type': 'text/plain' },
    });
    assert.equal(response.data.body, 'hello stream');
    const download = await client.get('/stream', { responseType: 'stream' });
    let text = '';
    for await (const chunk of download.data) text += chunk;
    assert.equal(text, 'first\nsecond\nlast\n');
    const controller = new AbortController();
    const pending = await client.get('/pending', {
      signal: controller.signal,
      responseType: 'stream',
    });
    const consumed = (async () => {
      for await (const chunk of pending.data) {
        assert.ok(chunk.length);
        controller.abort('finished');
      }
    })();
    await assert.rejects(consumed, checkError('ERR_CANCELED'));
  });
  test('HTTP size limits cover Node streamed bodies and default large payloads', async () => {
    await assert.rejects(
      client.post('/echo', Readable.from(['too large']), { maxBodyLength: 2, maxRedirects: 0 }),
      checkError('ERR_BAD_REQUEST')
    );
    await assert.rejects(
      client
        .get('/stream', { responseType: 'stream', maxContentLength: 4 })
        .then(async (response) => {
          for await (const _ of response.data) {
          }
        }),
      checkError('ERR_BAD_RESPONSE')
    );
    const large = 'x'.repeat(11 * 1024 * 1024);
    assert.equal((await client.post('/size', large, { maxRate: [0, 0] })).data.size, large.length);
  });
  test('HTTP keep-alive agents reuse connections and errors serialize safely', async () => {
    const agent = new http.Agent({ keepAlive: true, maxSockets: 1 });
    try {
      const first = await client.get('/echo', { httpAgent: agent });
      const second = await client.get('/echo', { httpAgent: agent });
      assert.equal(first.data.remotePort, second.data.remotePort);
      await assert.rejects(client.get('/status', { httpAgent: agent }), (error) => {
        assert.equal(JSON.parse(JSON.stringify(error)).status, 503);
        return true;
      });
    } finally {
      agent.destroy();
    }
  });
  test('HTTP explicit proxy routes redirects through the proxy', async () => {
    const proxy = new URL(info.proxy);
    const before = (await client.get('/records')).data.length;
    const response = await client.get('/redirect', {
      proxy: {
        protocol: 'http',
        host: proxy.hostname,
        port: Number(proxy.port),
        auth: { username: 'proxy-user', password: 'proxy-pass' },
      },
    });
    assert.equal(response.data.headers['proxy-authorization'], undefined);
    const records = (await client.get('/records')).data
      .slice(before)
      .filter((r) => r.path === 'proxy');
    assert.deepEqual(
      records.map((r) => r.target),
      [origin + '/redirect', origin + '/echo']
    );
    for (const record of records)
      assert.equal(
        record.headers['proxy-authorization'],
        'Basic ' + Buffer.from('proxy-user:proxy-pass').toString('base64')
      );
  });
  test('HTTP environment proxy, NO_PROXY, and proxy:false follow the configured route', async () => {
    const keys = [
      'HTTP_PROXY',
      'http_proxy',
      'HTTPS_PROXY',
      'https_proxy',
      'ALL_PROXY',
      'all_proxy',
      'NO_PROXY',
      'no_proxy',
    ];
    const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
    const count = async () =>
      (await client.get('/records')).data.filter((record) => record.path === 'proxy').length;
    try {
      for (const key of keys) delete process.env[key];
      process.env.HTTP_PROXY = info.proxy;
      const before = await count();
      await axios.get(origin + '/echo', { adapter: 'http' });
      assert.equal(await count(), before + 1);
      process.env.NO_PROXY = '127.0.0.1';
      await axios.get(origin + '/echo', { adapter: 'http' });
      assert.equal(await count(), before + 1);
      delete process.env.NO_PROXY;
      await axios.get(origin + '/echo', { adapter: 'http', proxy: false });
      assert.equal(await count(), before + 1);
    } finally {
      for (const key of keys)
        previous[key] === undefined ? delete process.env[key] : (process.env[key] = previous[key]);
    }
  });
  test('HTTP custom DNS lookup connects a consumer hostname to the local service', async () => {
    const target = new URL(origin);
    target.hostname = 'service.e2e.invalid';
    let calls = 0;
    const response = await client.get(target.href + 'echo', {
      lookup(hostname, options, callback) {
        calls++;
        assert.equal(hostname, 'service.e2e.invalid');
        options.all
          ? callback(null, [{ address: '127.0.0.1', family: 4 }])
          : callback(null, '127.0.0.1', 4);
      },
    });
    assert.equal(response.status, 200);
    assert.ok(calls > 0);
  });
  test('HTTP rate-limited upload sends all bytes over a measurable interval', async () => {
    const started = performance.now();
    const response = await client.post('/size', Buffer.alloc(2048), { maxRate: [1024, 0] });
    assert.equal(response.data.size, 2048);
    assert.ok(
      performance.now() - started >= 500,
      'a 2 KiB upload capped at 1 KiB/s must be throttled'
    );
  });
  test('header buckets accept AxiosHeaders from the other published build', async () => {
    const foreign =
      mode === 'esm' ? require('axios').AxiosHeaders : (await import('axios')).AxiosHeaders;
    const response = await client.post(
      '/echo',
      {},
      {
        headers: {
          common: new foreign({ 'X-Common': 'shared' }),
          post: new foreign({ 'X-Post': 'only-post' }),
        },
      }
    );
    assert.equal(response.data.headers['x-common'], 'shared');
    assert.equal(response.data.headers['x-post'], 'only-post');
    assert.equal(response.data.headers.common, undefined);
    assert.equal(response.data.headers.post, undefined);
    assert.equal(
      (await client.get('/echo', { headers: new Headers({ 'X-Native': 'yes' }) })).data.headers[
        'x-native'
      ],
      'yes'
    );
  });
  test('HTTP HTTPS CONNECT uses the configured trusted CA', async () => {
    const proxy = new URL(info.proxy);
    const before = (await client.get('/records')).data.length;
    const agent = new https.Agent({ ca: readFileSync('cert.pem'), servername: 'localhost' });
    try {
      const response = await client.get(info.secure + '/echo', {
        proxy: { protocol: 'http', host: proxy.hostname, port: Number(proxy.port) },
        httpsAgent: agent,
      });
      assert.equal(response.data.httpVersion, '1.1');
      const tunnels = (await client.get('/records')).data
        .slice(before)
        .filter((record) => record.path === 'connect');
      assert.deepEqual(
        tunnels.map((record) => record.target),
        [new URL(info.secure).host]
      );
    } finally {
      agent.destroy();
    }
    await assert.rejects(client.get(info.secure + '/echo'), (error) => axios.isAxiosError(error));
  });
  test('HTTP/2 sends real requests and reuses the configured session', async () => {
    const response = await client.get(info.http2 + '/echo', {
      httpVersion: 2,
      http2Options: { sessionTimeout: 50 },
    });
    assert.equal(response.data.httpVersion, '2.0');
    const again = await client.get(info.http2 + '/echo', {
      httpVersion: 2,
      http2Options: { sessionTimeout: 50 },
    });
    assert.equal(again.data.remotePort, response.data.remotePort);
  });
}
