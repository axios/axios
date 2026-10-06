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
});
