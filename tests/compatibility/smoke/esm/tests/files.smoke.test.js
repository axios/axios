import { describe, expect, it } from 'vitest';

import { PassThrough, Readable, Writable } from 'stream';
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
        res.end(response.body || JSON.stringify({ size: body.length }));
      };

      req.on('error', () => {});
      return req;
    },
  };
};

describe('files compat (dist export only)', () => {
  it('supports posting Buffer payloads', async () => {
    const source = Buffer.from('binary-\x00-data', 'utf8');

    const response = await axios.post('http://example.com/upload', source, {
      proxy: false,
      transport: createCaptureTransport((body) => ({
        body: JSON.stringify({ echoed: body.toString('base64') }),
      })),
    });

    expect(response.data.echoed).toBe(source.toString('base64'));
  });

  it('supports posting Uint8Array payloads', async () => {
    const source = Uint8Array.from([1, 2, 3, 4, 255]);

    const response = await axios.post('http://example.com/upload', source, {
      proxy: false,
      transport: createCaptureTransport((body) => ({
        body: JSON.stringify({ echoed: Array.from(body.values()) }),
      })),
    });

    expect(response.data.echoed).toEqual([1, 2, 3, 4, 255]);
  });

  it('supports posting Readable stream payloads', async () => {
    const streamData = ['hello ', 'stream ', 'world'];
    const source = Readable.from(streamData);

    const response = await axios.post('http://example.com/upload', source, {
      proxy: false,
      headers: { 'Content-Type': 'application/octet-stream' },
      transport: createCaptureTransport((body, options) => ({
        body: JSON.stringify({
          text: body.toString('utf8'),
          contentType:
            options.headers && (options.headers['Content-Type'] || options.headers['content-type']),
        }),
      })),
    });

    expect(response.data.text).toBe('hello stream world');
    expect(response.data.contentType).toContain('application/octet-stream');
  });

  it('supports binary downloads with responseType=arraybuffer', async () => {
    const binary = Buffer.from([0xde, 0xad, 0xbe, 0xef]);

    const response = await axios.get('http://example.com/file.bin', {
      proxy: false,
      responseType: 'arraybuffer',
      transport: createCaptureTransport(() => ({
        headers: { 'content-type': 'application/octet-stream' },
        body: binary,
      })),
    });

    expect(Buffer.isBuffer(response.data)).toBe(true);
    expect(response.data.equals(binary)).toBe(true);
  });
});
