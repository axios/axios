'use strict';

var assert = require('assert');
var axios = require('../../../index');
var estimate = require('../../../lib/helpers/estimateDataURLDecodedBytes');
var fromDataURI = require('../../../lib/helpers/fromDataURI');

function TestBlob(parts) {
  this.size = parts.reduce(function(total, part) { return total + part.length; }, 0);
}

describe('data URL metadata', function() {
  ['base64', 'text/plain;base64', 'text/plain;charset=utf-8;base64'].forEach(function(metadata) {
    ['TQ==', 'TQ%3D%3D'].forEach(function(body) {
      it('matches the decoder for ' + metadata + ' with ' + body, function() {
        var uri = 'data:' + metadata + ',' + body;
        assert.strictEqual(fromDataURI(uri, false).toString(), 'M');
        assert.strictEqual(estimate(uri), 1);
      });
    });

    ['text', 'arraybuffer', 'stream', 'blob'].forEach(function(responseType) {
      it('allows an exact byte limit for ' + metadata + ' as ' + responseType, async function() {
        var uri = 'data:' + metadata + ',TQ==';
        var response = await axios.get(uri, {
          maxContentLength: 1,
          responseType: responseType,
          env: {Blob: TestBlob}
        });
        if (responseType === 'stream') {
          var chunks = [];
          for await (var chunk of response.data) chunks.push(chunk);
          assert.strictEqual(Buffer.concat(chunks).toString(), 'M');
        } else if (responseType === 'blob') {
          assert.strictEqual(response.data.size, 1);
        } else {
          assert.strictEqual(response.data.toString(), 'M');
        }
        await assert.rejects(axios.get(uri, {
          maxContentLength: 0,
          responseType: responseType,
          env: {Blob: TestBlob}
        }), function(error) {
          return error.code === 'ERR_BAD_RESPONSE';
        });
      });
    });
  });

  ['text/plain;base64=x;', 'text/plain;base64note=x;', 'text/plain;BASE64=x;'].forEach(function(metadata) {
    it('retains text accounting for ' + metadata, function() {
      var uri = 'data:' + metadata + ',TQ==';
      assert.strictEqual(fromDataURI(uri, false).toString(), 'TQ==');
      assert.strictEqual(estimate(uri), 4);
    });
  });
});
