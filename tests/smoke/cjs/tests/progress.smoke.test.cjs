const { Readable, Writable, PassThrough } = require('stream');
const axios = require('axios');
const { describe, it } = require('mocha');
const { expect } = require('chai');

const createProgressTransport = (config) => {
  const opts = config || {};
  const responseChunks = opts.responseChunks || ['ok'];
  const responseHeaders = opts.responseHeaders || {};

  return {
    request(_options, onResponse) {
      const req = new Writable({
        write(_chunk, _encoding, callback) {
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

        const res = new PassThrough();
        res.statusCode = 200;
        res.statusMessage = 'OK';
        res.headers = Object.assign(
          {
            'content-type': 'text/plain',
          },
          responseHeaders
        );
        res.req = req;

        onResponse(res);

        responseChunks.forEach((chunk) => {
          res.write(chunk);
        });
        res.end();
      };

      return req;
    },
  };
};

describe('progress compat (dist export only)', () => {
  it('emits upload progress events for stream payloads', async () => {
    const samples = [];
    const payload = ['abc', 'def', 'ghi'];
    const total = payload.join('').length;

    await axios.post('http://example.com/upload', Readable.from(payload), {
      proxy: false,
      headers: {
        'Content-Length': String(total),
      },
      onUploadProgress: ({ loaded, total: reportedTotal, upload }) => {
        samples.push({ loaded, total: reportedTotal, upload });
      },
      transport: createProgressTransport({
        responseChunks: ['uploaded'],
      }),
    });

    expect(samples.length).to.be.greaterThan(0);
    expect(samples[samples.length - 1]).to.deep.include({
      loaded: total,
      total,
      upload: true,
    });
  });

  it('emits download progress events', async () => {
    const samples = [];
    const chunks = ['ab', 'cd', 'ef'];
    const total = chunks.join('').length;

    const response = await axios.get('http://example.com/download', {
      proxy: false,
      responseType: 'text',
      onDownloadProgress: ({ loaded, total: reportedTotal, download }) => {
        samples.push({ loaded, total: reportedTotal, download });
      },
      transport: createProgressTransport({
        responseChunks: chunks,
        responseHeaders: {
          'content-length': String(total),
        },
      }),
    });

    expect(response.data).to.equal('abcdef');
    expect(samples.length).to.be.greaterThan(0);
    expect(samples[samples.length - 1]).to.deep.include({
      loaded: total,
      total,
      download: true,
    });
  });
});
