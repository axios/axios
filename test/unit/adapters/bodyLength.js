'use strict';

var assert = require('assert');
var http = require('http');
var stream = require('stream');
var axios = require('../../../index');
var estimate = require('../../../lib/helpers/estimateDataURLDecodedBytes');

async function withUploadServer(run) {
  var received = [];
  var sockets = new Set();
  var server = http.createServer(function (req, res) {
    var chunks = [];
    var index = received.push(0) - 1;
    req.on('error', function () {});
    req.on('data', function (chunk) {
      received[index] += chunk.length;
      chunks.push(chunk);
    });
    req.on('end', function () {
      if (req.url === '/redirect') {
        res.writeHead(307, {Location: '/echo'});
        res.end();
      } else {
        res.end(Buffer.concat(chunks));
      }
    });
  });
  server.on('connection', function (socket) {
    sockets.add(socket);
    socket.on('close', function () { sockets.delete(socket); });
  });
  await new Promise(function (resolve) { server.listen(0, '127.0.0.1', resolve); });
  try {
    await run('http://127.0.0.1:' + server.address().port, received);
  } finally {
    sockets.forEach(function (socket) { socket.destroy(); });
    await new Promise(function (resolve) { server.close(resolve); });
  }
}

describe('encoded body length', function () {
  [
    {name: 'redirect-capable', options: {}},
    {name: 'native', options: {maxRedirects: 0}},
    {name: 'custom', options: {transport: http}}
  ].forEach(function (transport) {
    [
      {name: 'multibyte strings', chunks: ['éé']},
      {name: 'surrogate pairs', chunks: ['😀']},
      {name: 'mixed chunks', chunks: ['a', 'é', Buffer.from('b')]},
      {name: 'buffers', chunks: [Buffer.from('abcd')]}
    ].forEach(function (fixture) {
      it('limits ' + fixture.name + ' through the ' + transport.name + ' transport', async function () {
        await withUploadServer(async function (url, received) {
          await assert.rejects(axios.post(url, stream.Readable.from(fixture.chunks), Object.assign({
            proxy: false,
            maxBodyLength: 3
          }, transport.options)), function (error) {
            return error.code === 'ERR_BAD_REQUEST' && /maxBodyLength/.test(error.message);
          });
          assert.ok(received.every(function (length) { return length <= 3; }));
        });
      });
    });

    it('allows an exact byte limit through the ' + transport.name + ' transport', async function () {
      await withUploadServer(async function (url, received) {
        var response = await axios.post(url, stream.Readable.from(['é', 'é']), Object.assign({
          proxy: false,
          maxBodyLength: 4
        }, transport.options));
        assert.strictEqual(response.data, 'éé');
        assert.deepStrictEqual(received, [4]);
      });
    });
  });

  it('replays an allowed encoded body across a redirect', async function () {
    await withUploadServer(async function (url, received) {
      var response = await axios.post(url + '/redirect', stream.Readable.from(['é', 'é']), {
        proxy: false,
        maxBodyLength: 4
      });
      assert.strictEqual(response.data, 'éé');
      assert.deepStrictEqual(received, [4, 4]);
    });
  });

  function TestBlob(parts) {
    this.size = parts.reduce(function (total, part) { return total + part.length; }, 0);
  }

  ['BASE64=x', 'base64=x', 'base64note=x'].forEach(function (parameter) {
    var url = 'data:text/plain;' + parameter + ';,abcd';
    it('counts ordinary metadata parameter ' + parameter + ' as text', function () {
      assert.strictEqual(estimate(url), 4);
    });

    ['text', 'arraybuffer', 'stream', 'blob'].forEach(function (responseType) {
      it('checks data URL bytes before returning ' + responseType + ' with ' + parameter, async function () {
        await assert.rejects(axios.get(url, {
          maxContentLength: 3,
          responseType: responseType,
          env: {Blob: TestBlob}
        }), function (error) {
          return error.code === 'ERR_BAD_RESPONSE';
        });
        var response = await axios.get(url, {
          maxContentLength: 4,
          responseType: responseType,
          env: {Blob: TestBlob}
        });
        if (responseType === 'blob') {
          assert.strictEqual(response.data.size, 4);
        } else if (responseType === 'stream') {
          var chunks = [];
          for await (var chunk of response.data) chunks.push(chunk);
          assert.strictEqual(Buffer.concat(chunks).toString(), 'abcd');
        } else {
          assert.strictEqual(response.data.toString(), 'abcd');
        }
      });
    });
  });

  ['TQ', 'TWE', 'TWFu', 'TQ=='].forEach(function (encoded) {
    it('counts a base64 body of length ' + encoded.length, async function () {
      var url = 'data:text/plain;base64,' + encoded;
      var expected = Buffer.from(encoded, 'base64');
      assert.strictEqual(estimate(url), expected.length);
      var response = await axios.get(url, {maxContentLength: expected.length, responseType: 'arraybuffer'});
      assert.deepStrictEqual(response.data, expected);
      await assert.rejects(axios.get(url, {maxContentLength: expected.length - 1}), function (error) {
        return error.code === 'ERR_BAD_RESPONSE';
      });
    });
  });
});
