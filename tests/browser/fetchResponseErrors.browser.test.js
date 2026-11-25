import { describe, expect, it } from 'vitest';
import axios from '../../index.js';

describe('fetch response size errors', () => {
  for (const responseType of ['text', 'arrayBuffer', 'blob']) {
    for (const preserveCause of [true, false]) {
      it(`preserves wrapped ${responseType} limit errors ${preserveCause ? 'with' : 'without'} a cause`, async () => {
        let originalError;
        let wrappedError;
        let dispatchedRequest;

        class WrappedResponse extends Response {
          async [responseType]() {
            try {
              return await super[responseType]();
            } catch (error) {
              originalError = error;
              wrappedError = new TypeError('Load failed');
              if (preserveCause) {
                wrappedError.cause = error;
              }
              throw wrappedError;
            }
          }
        }

        const url = new URL('/response-limit', window.location.href).href;
        const error = await axios
          .get(url, {
            adapter: 'fetch',
            responseType,
            maxContentLength: 512,
            env: {
              Response: WrappedResponse,
              async fetch(request) {
                dispatchedRequest = request;
                // No Content-Length: enforce the limit while consuming the body.
                return new Response(
                  new ReadableStream({
                    start(controller) {
                      controller.enqueue(new Uint8Array(1024));
                      controller.close();
                    },
                  })
                );
              },
            },
          })
          .catch((error) => error);

        // Some native body readers already replace the stream's AxiosError.
        expect(originalError).toBeDefined();
        expect(error).toBeInstanceOf(axios.AxiosError);
        expect(error).not.toBe(wrappedError);
        expect(error.code).toBe(axios.AxiosError.ERR_BAD_RESPONSE);
        expect(error.message).toBe('maxContentLength size of 512 exceeded');
        expect(error.config.url).toBe(url);
        expect(error.config.maxContentLength).toBe(512);
        expect(error.request).toBe(dispatchedRequest);
      });
    }
  }

  for (const [label, method, status] of [
    ['HEAD 200', 'head', 200],
    ['HEAD 404', 'head', 404],
    ['GET 304', 'get', 304],
    ['GET 204', 'get', 204],
  ]) {
    it(`allows ${label} when representation Content-Length exceeds maxContentLength`, async () => {
      const url = new URL('/bodyless-limit', window.location.href).href;
      const response = await axios({
        adapter: 'fetch',
        method,
        url,
        maxContentLength: 1,
        validateStatus: () => true,
        env: {
          async fetch() {
            return new Response(null, {
              status,
              headers: { 'Content-Length': '5000' },
            });
          },
        },
      });

      expect(response.status).toBe(status);
      expect(response.data).toBe('');
      expect(response.headers.get('content-length')).toBe('5000');
    });
  }

  it('rejects 304 with a status error rather than a maxContentLength error under default validateStatus', async () => {
    const url = new URL('/not-modified', window.location.href).href;
    const error = await axios
      .get(url, {
        adapter: 'fetch',
        maxContentLength: 1,
        env: {
          async fetch() {
            return new Response(null, {
              status: 304,
              headers: { 'Content-Length': '5000' },
            });
          },
        },
      })
      .catch((err) => err);

    expect(error).toBeInstanceOf(axios.AxiosError);
    expect(error.code).toBe(axios.AxiosError.ERR_BAD_RESPONSE);
    expect(error.message).toBe('Request failed with status code 304');
    expect(error.response.status).toBe(304);
    expect(error.response.headers.get('content-length')).toBe('5000');
  });

  it('still rejects non-bodyless GET 200 responses with oversized Content-Length', async () => {
    const url = new URL('/oversized-declared', window.location.href).href;
    const error = await axios
      .get(url, {
        adapter: 'fetch',
        maxContentLength: 1,
        env: {
          async fetch() {
            return new Response(null, {
              status: 200,
              headers: { 'Content-Length': '5000' },
            });
          },
        },
      })
      .catch((err) => err);

    expect(error).toBeInstanceOf(axios.AxiosError);
    expect(error.code).toBe(axios.AxiosError.ERR_BAD_RESPONSE);
    expect(error.message).toBe('maxContentLength size of 1 exceeded');
  });
});
