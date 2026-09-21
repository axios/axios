import { describe, expect, it } from 'vitest';
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
    ['base64', 'BASE64', ' BaSe64 '].forEach((encoding) => {
      it('preserves the native ' + encoding + ' encoding suffix', async () => {
        const url = 'data:text/plain;' + encoding + ',TQ==';
        expect(estimateDataURLDecodedBytes(url)).toBe(1);
        expect((await axios.get(url, { adapter: 'fetch', maxContentLength: 1 })).data).toBe('M');
      });
    });
  });
}
