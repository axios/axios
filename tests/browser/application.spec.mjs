import { test, expect } from '@playwright/test';

const services = JSON.parse(process.env.AXIOS_E2E_SERVICES);
test.beforeEach(async ({ page }) => {
  await page.goto(services.origin + '/app');
  await page.waitForFunction(() => typeof window.axios === 'function');
});

test('a bundled consumer imports the installed release', async ({ page }) => {
  expect(await page.evaluate(() => window.axios.VERSION)).toBe(process.env.AXIOS_E2E_VERSION);
  await page.getByRole('button', { name: 'Load profile' }).click();
  await expect(page.locator('#result')).toContainText('/echo?user=42');
});

test('a user selects and submits a real binary file', async ({ page }) => {
  await page.locator('input[type=file]').setInputFiles({
    name: 'photo.bin',
    mimeType: 'application/octet-stream',
    buffer: Buffer.from([0, 255, 128]),
  });
  await page.getByRole('button', { name: 'Upload', exact: true }).click();
  await expect(page.locator('#result')).toContainText('photo.bin');
  const result = JSON.parse(await page.locator('#result').textContent());
  expect(result.form).toEqual([
    ['description', 'a real upload'],
    ['file', { name: 'photo.bin', type: 'application/octet-stream', bytes: [0, 255, 128] }],
  ]);
});

test('the installed classic-script UMD release makes a real request', async ({ page }) => {
  await page.addScriptTag({ url: services.origin + '/axios.umd.js' });
  const result = await page.evaluate(async () => ({
    version: window.axios.VERSION,
    data: (await window.axios.get('/echo')).data,
  }));
  expect(result.version).toBe(process.env.AXIOS_E2E_VERSION);
  expect(result.data.method).toBe('GET');
});

test('XHR upload progress reports the bytes received by the service', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const progress = [];
    const payload = new Uint8Array(65536).fill(65);
    const response = await window.axios.post('/size', payload, {
      adapter: 'xhr',
      onUploadProgress: (event) => progress.push(event.loaded),
    });
    return { received: response.data.size, finalProgress: progress.at(-1) };
  });
  expect(result).toEqual({ received: 65536, finalProgress: 65536 });
});

for (const adapter of ['xhr', 'fetch']) {
  test.describe(adapter, () => {
    for (const method of ['get', 'delete', 'head', 'options', 'post', 'put', 'patch']) {
      test(`${method.toUpperCase()} sends requests through the browser network`, async ({
        page,
      }) => {
        const result = await page.evaluate(
          async ({ adapter, method }) => {
            const response = await window.axios({
              url: '/echo',
              adapter,
              method,
              data: ['post', 'put', 'patch'].includes(method) ? { name: 'café' } : undefined,
            });
            return { status: response.status, data: response.data };
          },
          { adapter, method }
        );
        expect(result.status).toBe(method === 'options' ? 204 : 200);
        if (!['head', 'options'].includes(method))
          expect(result.data.method).toBe(method.toUpperCase());
        if (['post', 'put', 'patch'].includes(method))
          expect(JSON.parse(result.data.body)).toEqual({ name: 'café' });
      });
    }
    test('JSON errors, explicit text, and response transforms retain their meanings', async ({
      page,
    }) => {
      const result = await page.evaluate(async (adapter) => {
        const client = window.axios.create({ adapter });
        const text = await client.get('/json', { responseType: 'text' });
        const allowed = await client.get('/status?code=404', {
          validateStatus: (status) => status < 500,
        });
        try {
          await client.get('/status');
        } catch (error) {
          return {
            text: typeof text.data,
            allowed: allowed.status,
            code: error.code,
            isAxiosError: window.axios.isAxiosError(error),
            status: error.response.status,
            data: error.response.data,
          };
        }
        throw new Error('Expected the 503 response to reject');
      }, adapter);
      expect(result).toEqual({
        text: 'string',
        allowed: 404,
        code: 'ERR_BAD_RESPONSE',
        isAxiosError: true,
        status: 503,
        data: { error: 'service unavailable' },
      });
    });
    test('interceptors attach an access token and transform a real response', async ({ page }) => {
      const result = await page.evaluate(async (adapter) => {
        const client = window.axios.create({ adapter });
        const order = [];
        client.interceptors.request.use(async (config) => {
          order.push('first');
          config.headers.set('X-Token', 'e2e-token');
          return config;
        });
        client.interceptors.request.use((config) => {
          order.push('second');
          return config;
        });
        client.interceptors.response.use((response) => {
          order.push('response');
          return response;
        });
        const response = await client.get('/echo');
        return { order, token: response.data.headers['x-token'] };
      }, adapter);
      expect(result).toEqual({ order: ['second', 'first', 'response'], token: 'e2e-token' });
    });
    test('same-origin cookies supply XSRF but cross-origin requires an explicit opt-in', async ({
      page,
    }) => {
      const result = await page.evaluate(
        async ({ adapter, other }) => {
          const client = window.axios.create({ adapter });
          await client.get('/cookie');
          const same = await client.get('/echo');
          const cross = await client.get(other + '/echo', { withCredentials: true });
          const forced = await client.get(other + '/echo', {
            withCredentials: true,
            withXSRFToken: true,
          });
          const disabled = await client.get('/echo', { withXSRFToken: false });
          return {
            same: same.data.headers,
            cross: cross.data.headers,
            forced: forced.data.headers,
            disabled: disabled.data.headers,
          };
        },
        { adapter, other: services.other }
      );
      expect(result.same['x-xsrf-token']).toBe('e2e-token');
      expect(result.cross.cookie).toContain('session=e2e');
      expect(result.cross['x-xsrf-token']).toBeUndefined();
      expect(result.forced['x-xsrf-token']).toBe('e2e-token');
      expect(result.disabled['x-xsrf-token']).toBeUndefined();
    });
    test('real CORS rejection and closed sockets reject as network errors', async ({ page }) => {
      const errors = await page.evaluate(
        async ({ adapter, other }) => {
          const codes = [];
          for (const url of [other + '/no-cors', '/reset']) {
            try {
              await window.axios.get(url, { adapter });
              codes.push('unexpected success');
            } catch (error) {
              codes.push(error.code);
            }
          }
          return codes;
        },
        { adapter, other: services.other }
      );
      expect(errors).toEqual(['ERR_NETWORK', 'ERR_NETWORK']);
    });
    test('multipart boundaries and URL-encoded forms reach the server intact', async ({ page }) => {
      const result = await page.evaluate(async (adapter) => {
        const client = window.axios.create({ adapter });
        const form = new FormData();
        form.append('name', 'value');
        form.append('file', new Blob([new Uint8Array([255, 0])]), 'file.bin');
        const multipart = await client.post('/echo', form);
        const encoded = await client.post('/echo', new URLSearchParams({ q: 'a b', plus: '+' }));
        const automatic = await client.postForm('/echo', { name: 'automatic' });
        return { multipart: multipart.data, encoded: encoded.data, automatic: automatic.data };
      }, adapter);
      expect(result.multipart.headers['content-type']).toMatch(/^multipart\/form-data;.*boundary=/);
      expect(result.multipart.form[1][1].bytes).toEqual([255, 0]);
      expect(new URLSearchParams(result.encoded.body).get('plus')).toBe('+');
      expect(result.automatic.form).toEqual([['name', 'automatic']]);
    });
    test('download bytes and final progress reflect a real streamed response', async ({ page }) => {
      const result = await page.evaluate(async (adapter) => {
        const samples = [];
        const stream = await window.axios.get('/stream', {
          adapter,
          responseType: 'text',
          onDownloadProgress: (event) => samples.push(event.loaded),
        });
        const binary = await window.axios.get('/binary', { adapter, responseType: 'arraybuffer' });
        const blob = await window.axios.get('/binary', { adapter, responseType: 'blob' });
        return {
          text: stream.data,
          last: samples.at(-1),
          bytes: [...new Uint8Array(binary.data)],
          blobBytes: [...new Uint8Array(await blob.data.arrayBuffer())],
        };
      }, adapter);
      expect(result).toEqual({
        text: 'first\nsecond\nlast\n',
        last: 18,
        bytes: [0, 255, 1, 128, 13, 10],
        blobBytes: [0, 255, 1, 128, 13, 10],
      });
    });
    test('timeouts and in-flight AbortSignal cancellation reject', async ({ page }) => {
      const result = await page.evaluate(async (adapter) => {
        const client = window.axios.create({ adapter });
        let timeout;
        try {
          await client.get('/slow', {
            timeout: 40,
            timeoutErrorMessage: 'service deadline',
            transitional: { clarifyTimeoutError: true },
          });
        } catch (error) {
          timeout = { code: error.code, message: error.message };
        }
        const controller = new AbortController();
        const pending = client.get('/stream', {
          signal: controller.signal,
          onDownloadProgress() {
            controller.abort('user stopped');
          },
        });
        try {
          await pending;
          throw new Error('unexpected success');
        } catch (error) {
          return { timeout, canceled: error.code, isCancel: window.axios.isCancel(error) };
        }
      }, adapter);
      expect(result).toEqual({
        timeout: { code: 'ETIMEDOUT', message: 'service deadline' },
        canceled: 'ERR_CANCELED',
        isCancel: true,
      });
    });
    test('pre-aborted signals and CancelToken remain supported', async ({ page }) => {
      const codes = await page.evaluate(async (adapter) => {
        const controller = new AbortController();
        controller.abort();
        const source = window.axios.CancelToken.source();
        source.cancel('legacy cancellation');
        const codes = [];
        for (const options of [{ signal: controller.signal }, { cancelToken: source.token }]) {
          try {
            await window.axios.get('/echo', { ...options, adapter });
            codes.push('unexpected success');
          } catch (error) {
            codes.push(error.code);
          }
        }
        return codes;
      }, adapter);
      expect(codes).toEqual(['ERR_CANCELED', 'ERR_CANCELED']);
    });
    test('Basic authentication and case-insensitive headers arrive on the wire', async ({
      page,
    }) => {
      const result = await page.evaluate(
        async (adapter) =>
          (
            await window.axios.post(
              '/echo',
              {},
              {
                adapter,
                auth: { username: 'user', password: 'pass' },
                headers: { authorization: 'Bearer replaced', 'X-Case': 'first', 'x-case': 'last' },
              }
            )
          ).data.headers,
        adapter
      );
      expect(result.authorization).toBe('Basic dXNlcjpwYXNz');
      expect(result['x-case']).toBe('last');
    });
    test('base URL paths and allowAbsoluteUrls prevent an absolute override', async ({ page }) => {
      const result = await page.evaluate(
        async ({ adapter, origin, other }) => {
          const client = window.axios.create({
            adapter,
            baseURL: origin + '/base/',
            allowAbsoluteUrls: false,
          });
          return (await client.get(other + '/echo')).data;
        },
        { adapter, ...services }
      );
      expect(result.headers.host).toBe(new URL(services.origin).host);
      expect(result.url).toContain('/base/http://');
    });
  });
}
