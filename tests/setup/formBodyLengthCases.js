import { describe, expect, it, vi } from 'vitest';
import platform from '../../lib/platform/index.js';
import axios from '../../index.js';
import formDataToBlob from '../../lib/helpers/formDataToBlob.js';
import estimateDataURLDecodedBytes from '../../lib/helpers/estimateDataURLDecodedBytes.js';

export default function formBodyLengthCases() {
  describe('fetch multipart body length', () => {
    class StreamingRequest extends Request {
      arrayBuffer() {
        throw new Error('Multipart measurement must not buffer the complete body');
      }
    }

    const makeForm = () => {
      const form = new FormData();
      form.append('message', 'café\nsecond line');
      form.append('file', new Blob(['contents'], { type: 'text/plain' }), 'note.txt');
      return form;
    };

    it('uses each configured Blob constructor when reusing a fetch implementation', async () => {
      const created = [];
      class FirstBlob extends Blob {
        constructor(parts, options) {
          super(parts, options);
          created.push(this);
        }
      }
      class SecondBlob extends FirstBlob {}
      const envFetch = async (request) => {
        const form = await request.formData();
        expect(form.get('message')).toBe('café\r\nsecond line');
        expect(await form.get('file').text()).toBe('contents');
        return new Response('ok');
      };
      for (const BlobConstructor of [FirstBlob, SecondBlob, FirstBlob]) {
        const before = created.length;
        const response = await axios.post('http://localhost/form', makeForm(), {
          adapter: 'fetch',
          maxBodyLength: 4096,
          env: { fetch: envFetch, Blob: BlobConstructor },
        });
        expect(response.data).toBe('ok');
        expect(created.length).toBeGreaterThan(before);
        expect(created[created.length - 1].constructor).toBe(BlobConstructor);
      }
    });

    [false, true].forEach((progress) => {
      it(
        'uses a configured Blob without the global constructor with progress=' + progress,
        async () => {
          const NativeBlob = Blob;
          const form = makeForm();
          let constructed = false;
          class CustomBlob extends NativeBlob {
            constructor(parts, options) {
              super(parts, options);
              constructed = true;
            }
          }
          vi.stubGlobal('Blob', undefined);
          try {
            const response = await axios.post('http://localhost/form', form, {
              adapter: 'fetch',
              maxBodyLength: 4096,
              onUploadProgress: progress ? () => {} : undefined,
              env: {
                Blob: CustomBlob,
                async fetch(request) {
                  const decoded = await request.formData();
                  expect(decoded.get('message')).toBe('café\r\nsecond line');
                  expect(await decoded.get('file').text()).toBe('contents');
                  return new Response('ok');
                },
              },
            });
            expect(response.data).toBe('ok');
            expect(constructed).toBe(true);
          } finally {
            vi.unstubAllGlobals();
          }
        }
      );
    });

    it('falls back to the global Blob only when the configured value is undefined', async () => {
      const env = {
        Blob: undefined,
        async fetch(request) {
          expect((await request.formData()).get('message')).toBe('café\r\nsecond line');
          return new Response('ok');
        },
      };
      const config = { adapter: 'fetch', maxBodyLength: 4096, env };
      expect((await axios.post('http://localhost/form', makeForm(), config)).data).toBe('ok');
      env.Blob = null;
      await expect(axios.post('http://localhost/form', makeForm(), config)).rejects.toMatchObject({
        code: 'ERR_NOT_SUPPORT',
      });
    });

    [false, true].forEach((progress) => {
      [undefined, 4096].forEach((limit) => {
        it(`preserves multipart content with progress=${progress} and limit=${limit}`, async () => {
          const events = [];
          const response = await axios.post('http://localhost/form', makeForm(), {
            adapter: 'fetch',
            headers: { 'Content-Type': 'multipart/form-data' },
            maxBodyLength: limit,
            onUploadProgress: progress ? (event) => events.push(event) : undefined,
            env: {
              Request: StreamingRequest,
              async fetch(request) {
                const form = await request.formData();
                expect(form.get('message')).toBe('café\r\nsecond line');
                expect(form.get('file').name).toBe('note.txt');
                expect(await form.get('file').text()).toBe('contents');
                return new Response('ok');
              },
            },
          });
          expect(response.data).toBe('ok');
          // Browsers without request streaming do not emit upload progress.
          if (events.length) {
            const last = events[events.length - 1];
            expect(last.loaded).toBe(last.total);
            expect(last.total).toBeGreaterThan(20);
          }
        });
      });
    });

    [false, true].forEach((progress) => {
      [undefined, 4096].forEach((limit) => {
        ['BoundaryMiXeD42', 'MiXeD boundary,+42'].forEach((boundary) => {
          it(`retains the explicit ${boundary} boundary with progress=${progress} and limit=${limit}`, async () => {
            const contentType = `multipart/form-data; boundary="${boundary}"`;
            const response = await axios.post('http://localhost/form', makeForm(), {
              adapter: 'fetch',
              headers: { 'Content-Type': contentType },
              maxBodyLength: limit,
              onUploadProgress: progress ? () => {} : undefined,
              env: {
                async fetch(request) {
                  expect(request.headers.get('content-type')).toBe(contentType);
                  const body = await request.text();
                  expect(body).toBe(
                    [
                      '--' + boundary,
                      'Content-Disposition: form-data; name="message"',
                      '',
                      'café',
                      'second line',
                      '--' + boundary,
                      'Content-Disposition: form-data; name="file"; filename="note.txt"',
                      'Content-Type: text/plain',
                      '',
                      'contents',
                      '--' + boundary + '--',
                      '',
                    ].join('\r\n')
                  );
                  return new Response('ok');
                },
              },
            });
            expect(response.data).toBe('ok');
          });
        });
      });
    });

    it('checks explicit boundary length as part of the exact body limit', async () => {
      const form = makeForm();
      const boundary = 'MiXeD-12345';
      const size = formDataToBlob(form, Blob, Infinity, () => new Error('Too long'), boundary).size;
      let calls = 0;
      const options = {
        adapter: 'fetch',
        headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
        env: {
          async fetch(request) {
            calls++;
            const decoded = await request.formData();
            expect(await decoded.get('file').text()).toBe('contents');
            return new Response('ok');
          },
        },
      };
      await expect(
        axios.post(
          'http://localhost/form',
          form,
          Object.assign({}, options, { maxBodyLength: size - 1 })
        )
      ).rejects.toMatchObject({ code: 'ERR_BAD_REQUEST' });
      expect(calls).toBe(0);
      expect(
        (
          await axios.post(
            'http://localhost/form',
            form,
            Object.assign({}, options, { maxBodyLength: size })
          )
        ).data
      ).toBe('ok');
      expect(calls).toBe(1);
    });

    ['', 'a'.repeat(71), 'trailing ', 'line\nbreak'].forEach((boundary) => {
      it('rejects invalid boundary ' + JSON.stringify(boundary), () => {
        expect(() =>
          formDataToBlob(makeForm(), Blob, 4096, () => new Error('Too long'), boundary)
        ).toThrowError(expect.objectContaining({ code: 'ERR_BAD_OPTION_VALUE' }));
      });
    });

    const withoutPlatformRandom = (run) => {
      const descriptor = Object.getOwnPropertyDescriptor(platform, 'generateString');
      Object.defineProperty(platform, 'generateString', { value: undefined, configurable: true });
      try {
        run();
      } finally {
        if (descriptor) Object.defineProperty(platform, 'generateString', descriptor);
        else delete platform.generateString;
        vi.unstubAllGlobals();
      }
    };

    it('uses Web Crypto for generated boundaries when no platform generator is present', () => {
      withoutPlatformRandom(() => {
        let entropy = 17;
        const getRandomValues = vi.fn((bytes) => {
          bytes.fill(entropy);
          return bytes;
        });
        vi.stubGlobal('crypto', { getRandomValues });
        const generateType = () => {
          const body = formDataToBlob(makeForm(), Blob, 4096, () => new Error('Too long'));
          const match = /^multipart\/form-data; boundary=(axios-[a-z0-9'()+_,./:=?-]+)$/.exec(
            body.type
          );
          expect(match).not.toBeNull();
          expect(match[1].length).toBeLessThanOrEqual(70);
          return body.type;
        };
        const first = generateType();
        expect(generateType()).toBe(first);
        entropy = 34;
        expect(generateType()).not.toBe(first);
        expect(getRandomValues).toHaveBeenCalled();
      });
    });

    it('reports unavailable random generation instead of choosing a fallback boundary', () => {
      withoutPlatformRandom(() => {
        vi.stubGlobal('crypto', undefined);
        expect(() =>
          formDataToBlob(makeForm(), Blob, 4096, () => new Error('Too long'))
        ).toThrowError(expect.objectContaining({ code: 'ERR_NOT_SUPPORT' }));
        const explicit = formDataToBlob(
          makeForm(),
          Blob,
          4096,
          () => new Error('Too long'),
          'caller-boundary'
        );
        expect(explicit.size).toBeGreaterThan(0);
      });
    });

    it.skipIf(typeof platform.generateString !== 'function')(
      'retains the Node random source without global Web Crypto',
      () => {
        vi.stubGlobal('crypto', undefined);
        try {
          const first = formDataToBlob(makeForm(), Blob, 4096, () => new Error('Too long'));
          const second = formDataToBlob(makeForm(), Blob, 4096, () => new Error('Too long'));
          expect(first.type).toMatch(/^multipart\/form-data; boundary=axios-[a-f0-9]{36}$/);
          expect(second.type).not.toBe(first.type);
        } finally {
          vi.unstubAllGlobals();
        }
      }
    );

    [0, 16, 256].forEach((limit) => {
      it(`rejects multipart data above a ${limit} byte limit before dispatch`, async () => {
        let calls = 0;
        await expect(
          axios.post('http://localhost/form', makeForm(), {
            adapter: 'fetch',
            headers: { 'Content-Type': 'multipart/form-data' },
            maxBodyLength: limit,
            env: {
              Request: StreamingRequest,
              fetch() {
                calls++;
                return Promise.resolve(new Response('unexpected'));
              },
            },
          })
        ).rejects.toMatchObject({ code: 'ERR_BAD_REQUEST' });
        expect(calls).toBe(0);
      });
    });

    [false, true].forEach((empty) => {
      it(
        'uses an exact multipart limit for ' + (empty ? 'empty' : 'encoded') + ' fields',
        async () => {
          const form = new FormData();
          if (!empty) {
            form.append('line\nname', 'café\n\r\r\n😀');
            form.append('upload', new Blob(['bytes']), '');
          }
          const blob = formDataToBlob(form, Blob, Infinity, () => new Error('Too long'));
          let constructions = 0;
          class CountedBlob extends Blob {
            constructor(parts, options) {
              constructions++;
              super(parts, options);
            }
          }
          expect(() =>
            formDataToBlob(form, CountedBlob, blob.size - 1, () => new Error('Too long'))
          ).toThrow('Too long');
          expect(constructions).toBe(0);
          const exact = formDataToBlob(form, CountedBlob, blob.size, () => new Error('Too long'));
          expect(exact.size).toBe(blob.size);
          expect(constructions).toBe(1);
          const decoded = await new Response(exact).formData();
          expect(Array.from(decoded.keys()).length).toBe(empty ? 0 : 2);
          if (!empty) expect(decoded.get('upload').name).toBe('');
        }
      );
    });

    it('checks multipart size before native serialization or file reads', async () => {
      class SizedRequest extends StreamingRequest {
        constructor(url, init) {
          if (init && init.body instanceof FormData) {
            throw new Error('Unexpected native multipart serialization');
          }
          super(url, init);
        }
      }
      const form = makeForm();
      const file = form.get('file');
      file.arrayBuffer = file.stream = () => {
        throw new Error('Unexpected file read');
      };
      await expect(
        axios.post('http://localhost/form', form, {
          adapter: 'fetch',
          headers: { 'Content-Type': 'multipart/form-data' },
          maxBodyLength: 16,
          env: {
            Request: SizedRequest,
            fetch() {
              throw new Error('Unexpected dispatch');
            },
          },
        })
      ).rejects.toMatchObject({ code: 'ERR_BAD_REQUEST' });
      const response = await axios.post('http://localhost/form', form, {
        adapter: 'fetch',
        maxBodyLength: 4096,
        env: {
          Request: SizedRequest,
          async fetch(request) {
            const decoded = await request.formData();
            expect(await decoded.get('file').text()).toBe('contents');
            return new Response('ok');
          },
        },
      });
      expect(response.data).toBe('ok');
    });

    it('passes a sized multipart Blob when Request is unavailable', async () => {
      class StreamingResponse extends Response {
        arrayBuffer() {
          throw new Error('Unexpected body buffering');
        }
      }
      const response = await axios.post('http://localhost/form', makeForm(), {
        adapter: 'fetch',
        headers: { 'Content-Type': 'multipart/form-data' },
        maxBodyLength: 4096,
        env: {
          Request: null,
          Response: StreamingResponse,
          fetch(_url, options) {
            expect(options.body instanceof Blob).toBe(true);
            expect(options.body.size).toBeLessThan(4096);
            return Promise.resolve(new Response('ok'));
          },
        },
      });
      expect(response.data).toBe('ok');
    });

    it('keeps multipart data measurable without Request or Response constructors', async () => {
      const response = await axios.post('http://localhost/form', makeForm(), {
        adapter: 'fetch',
        maxBodyLength: 4096,
        env: {
          Request: null,
          Response: null,
          async fetch(_url, options) {
            const decoded = await new Response(options.body).formData();
            expect(await decoded.get('file').text()).toBe('contents');
            return new Response('ok');
          },
        },
      });
      expect(response.data).toBe('ok');
    });
  });

  describe('fetch data URL byte estimates', () => {
    ['base64=x', 'BASE64=x', 'base64note=x', 'base64;note=x'].forEach((metadata) => {
      it('counts ' + metadata + ' as an ordinary text parameter', async () => {
        const url = 'data:text/plain;' + metadata + ',abcd';
        expect(estimateDataURLDecodedBytes(url)).toBe(4);
        let calls = 0;
        await expect(
          axios.get(url, {
            adapter: 'fetch',
            maxContentLength: 3,
            env: {
              fetch() {
                calls++;
                return Promise.resolve(new Response('unexpected'));
              },
            },
          })
        ).rejects.toMatchObject({ code: 'ERR_BAD_RESPONSE' });
        expect(calls).toBe(0);
        expect((await axios.get(url, { adapter: 'fetch', maxContentLength: 4 })).data).toBe('abcd');
      });
    });
    ['\t', '\n', '\r', ' \t\r\n '].forEach((whitespace) => {
      it('handles URL preprocessing before base64 for ' + JSON.stringify(whitespace), async () => {
        const url = 'data:text/plain;' + whitespace + 'base64,TQ==';
        // URL runtimes either remove these characters or percent-encode them.
        // Match the resulting native Fetch body in either case.
        const nativeBody = await (await fetch(url)).text();
        expect(['M', 'TQ==']).toContain(nativeBody);
        expect(estimateDataURLDecodedBytes(new URL(url).href)).toBe(nativeBody.length);
        expect(
          (await axios.get(url, { adapter: 'fetch', maxContentLength: nativeBody.length })).data
        ).toBe(nativeBody);
        await expect(
          axios.get(url, { adapter: 'fetch', maxContentLength: nativeBody.length - 1 })
        ).rejects.toMatchObject({ code: 'ERR_BAD_RESPONSE' });
      });
    });

    ['\f', '\v', '\u00a0'].forEach((whitespace) => {
      it(
        'keeps non-marker whitespace as MIME metadata for ' + JSON.stringify(whitespace),
        async () => {
          const url = 'data:text/plain;' + whitespace + 'base64,TQ==';
          expect(estimateDataURLDecodedBytes(new URL(url).href)).toBe(4);
          expect((await axios.get(url, { adapter: 'fetch', maxContentLength: 4 })).data).toBe(
            'TQ=='
          );
          await expect(
            axios.get(url, { adapter: 'fetch', maxContentLength: 1 })
          ).rejects.toMatchObject({ code: 'ERR_BAD_RESPONSE' });
        }
      );
    });

    ['base64', 'BASE64', ' BaSe64 '].forEach((encoding) => {
      it('preserves the native ' + encoding + ' encoding suffix', async () => {
        const url = 'data:text/plain;' + encoding + ',TQ==';
        expect(estimateDataURLDecodedBytes(url)).toBe(1);
        expect((await axios.get(url, { adapter: 'fetch', maxContentLength: 1 })).data).toBe('M');
      });
    });
  });
}
