import { describe, expect, test } from 'bun:test';
import { PassThrough, Writable } from 'node:stream';
import FormDataPackage from 'form-data';
import axios from 'axios';

const createTransportMock = (
  responseFactory?: (body: Buffer, options: Record<string, any>) => Record<string, any>
) => {
  const transport = {
    request(options: Record<string, any>, onResponse: (res: PassThrough) => void) {
      const chunks: Buffer[] = [];

      const req = new Writable({
        write(chunk, _encoding, callback) {
          chunks.push(Buffer.from(chunk));
          callback();
        },
      }) as Writable & Record<string, any>;

      req.destroyed = false;
      req.setTimeout = () => {};
      req.write = req.write.bind(req);
      req.destroy = () => {
        req.destroyed = true;
        return req;
      };
      req.close = req.destroy;
      const originalEnd = req.end.bind(req);
      req.end = (...args: unknown[]) => {
        originalEnd(...(args as Parameters<Writable['end']>));

        const body = Buffer.concat(chunks);
        const response = responseFactory ? responseFactory(body, options) : {};

        const res = new PassThrough() as PassThrough & Record<string, any>;
        res.statusCode = response.statusCode ?? 200;
        res.statusMessage = response.statusMessage ?? 'OK';
        res.headers = response.headers ?? { 'content-type': 'application/json' };
        res.req = req;

        onResponse(res);
        res.end(response.body ?? JSON.stringify({ ok: true }));

        return req;
      };

      return req;
    },
  };

  return { transport };
};

const bodyAsUtf8 = (value: unknown) => {
  return Buffer.isBuffer(value) ? value.toString('utf8') : String(value);
};

describe('form data', () => {
  test('native Bun FormData body produces multipart/form-data content-type', async () => {
    const form = new FormData();
    form.append('username', 'janedoe');
    form.append('role', 'admin');

    const { transport } = createTransportMock((body, options) => ({
      body: JSON.stringify({
        contentType:
          options.headers && (options.headers['Content-Type'] || options.headers['content-type']),
        payload: bodyAsUtf8(body),
      }),
    }));

    const response = await axios.post('http://example.com/form', form, {
      adapter: 'http',
      proxy: false,
      transport,
    });

    expect(response.data.contentType).toContain('multipart/form-data');
    expect(response.data.payload).toContain('name="username"');
    expect(response.data.payload).toContain('janedoe');
    expect(response.data.payload).toContain('name="role"');
    expect(response.data.payload).toContain('admin');
  });

  test('npm form-data package instance is serialized correctly', async () => {
    const form = new FormDataPackage();
    form.append('project', 'axios');
    form.append('mode', 'compat');

    const { transport } = createTransportMock((body, options) => ({
      body: JSON.stringify({
        contentType:
          options.headers && (options.headers['Content-Type'] || options.headers['content-type']),
        payload: bodyAsUtf8(body),
      }),
    }));

    const response = await axios.post('http://example.com/npm-form-data', form as any, {
      adapter: 'http',
      proxy: false,
      transport,
    });

    expect(response.data.contentType).toContain('multipart/form-data');
    expect(response.data.payload).toContain('name="project"');
    expect(response.data.payload).toContain('axios');
    expect(response.data.payload).toContain('name="mode"');
    expect(response.data.payload).toContain('compat');
  });
});
