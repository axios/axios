const { Writable, PassThrough } = require('stream');
const axios = require('axios');
const { describe, it } = require('mocha');
const { expect } = require('chai');

const NODE_VERSION = parseInt(process.versions.node.split('.')[0]);
const describeWithFormData = NODE_VERSION < 18 ? describe.skip : describe;

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

describeWithFormData('formData compat (dist export only)', () => {
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

    expect(response.data.contentType).to.contain('multipart/form-data');
    expect(response.data.payload).to.contain('name="username"');
    expect(response.data.payload).to.contain('janedoe');
    expect(response.data.payload).to.contain('name="role"');
    expect(response.data.payload).to.contain('admin');
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

    expect(response.data.contentType).to.contain('multipart/form-data');
    expect(response.data.payload).to.contain('name="project"');
    expect(response.data.payload).to.contain('axios');
    expect(response.data.payload).to.contain('name="mode"');
    expect(response.data.payload).to.contain('compat');
  });
});
