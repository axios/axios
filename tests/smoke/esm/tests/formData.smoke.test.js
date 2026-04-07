import { describe, expect, it } from 'vitest';

import { Writable, PassThrough } from 'stream';
import axios from 'axios';

const createCaptureTransport = (buildResponse) => {
  return {
    request(options, onResponse) {
      const chunks = [];

      const req = new Writable({
        write(chunk, _encoding, callback) {
          chunks.push(Buffer.from(chunk));
          callback();
        },
      });

      req.destroyed = false;
      req.setTimeout = () => {};
      req.write = req.write.bind(req);
      req.close = () => {
        req.destroyed = true;
      };

      const originalDestroy = req.destroy.bind(req);
      req.destroy = (...args) => {
        req.destroyed = true;
        return originalDestroy(...args);
      };

      const originalEnd = req.end.bind(req);
      req.end = (...args) => {
        originalEnd(...args);

        const body = Buffer.concat(chunks);
        const response = buildResponse ? buildResponse(body, options) : {};

        const res = new PassThrough();
        res.statusCode = response.statusCode !== undefined ? response.statusCode : 200;
        res.statusMessage = response.statusMessage || 'OK';
        res.headers = response.headers || { 'content-type': 'application/json' };
        res.req = req;

        onResponse(res);
        res.end(response.body || JSON.stringify({ ok: true }));
      };

      return req;
    },
  };
};

const bodyAsUtf8 = (value) => {
  return Buffer.isBuffer(value) ? value.toString('utf8') : String(value);
};

describe('formData compat (dist export only)', () => {
  it('supports posting FormData instances', async () => {
    const form = new FormData();
    form.append('username', 'janedoe');
    form.append('role', 'admin');

    const response = await axios.post('http://example.com/form', form, {
      proxy: false,
      transport: createCaptureTransport((body, options) => ({
        body: JSON.stringify({
          contentType:
            options.headers && (options.headers['Content-Type'] || options.headers['content-type']),
          payload: bodyAsUtf8(body),
        }),
      })),
    });

    expect(response.data.contentType).toContain('multipart/form-data');
    expect(response.data.payload).toContain('name="username"');
    expect(response.data.payload).toContain('janedoe');
    expect(response.data.payload).toContain('name="role"');
    expect(response.data.payload).toContain('admin');
  });

  it('supports axios.postForm helper', async () => {
    const response = await axios.postForm(
      'http://example.com/post-form',
      {
        project: 'axios',
        mode: 'compat',
      },
      {
        proxy: false,
        transport: createCaptureTransport((body, options) => ({
          body: JSON.stringify({
            contentType:
              options.headers &&
              (options.headers['Content-Type'] || options.headers['content-type']),
            payload: bodyAsUtf8(body),
          }),
        })),
      }
    );

    expect(response.data.contentType).toContain('multipart/form-data');
    expect(response.data.payload).toContain('name="project"');
    expect(response.data.payload).toContain('axios');
    expect(response.data.payload).toContain('name="mode"');
    expect(response.data.payload).toContain('compat');
  });
});
