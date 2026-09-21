import { describe, it } from 'vitest';
import assert from 'assert';
import { execFile } from 'child_process';
import AxiosTransformStream from '../../../lib/helpers/AxiosTransformStream.js';

function collectChunks(options, size) {
  return new Promise(function (resolve, reject) {
    var stream = new AxiosTransformStream(options);
    var chunks = [];
    var progress = [];
    stream.on('data', function (chunk) {
      chunks.push(chunk.length);
    });
    stream.on('progress', function (loaded) {
      progress.push(loaded);
    });
    stream.on('error', reject);
    stream.on('end', function () {
      resolve({ chunks: chunks, progress: progress });
    });
    stream.end(Buffer.alloc(size));
  });
}

describe('AxiosTransformStream', function () {
  [1, 100].forEach(function (tailSize) {
    it(
      'keeps an unlimited stream tail of ' + tailSize + ' bytes in its original chunk',
      async function () {
        var result = await collectChunks({ chunkSize: 16 }, 16 + tailSize);
        assert.deepStrictEqual(result.chunks, [16 + tailSize]);
        assert.deepStrictEqual(result.progress, [16 + tailSize]);
      }
    );
  });

  it('retains a configured minimum tail size for unlimited streams', async function () {
    var result = await collectChunks({ chunkSize: 16, minChunkSize: 3 }, 19);
    assert.deepStrictEqual(result.chunks, [19]);
    assert.deepStrictEqual(result.progress, [19]);
  });

  it('splits tails above the configured minimum', async function () {
    var result = await collectChunks({ chunkSize: 16, minChunkSize: 3 }, 20);
    assert.deepStrictEqual(result.chunks, [16, 4]);
    assert.deepStrictEqual(result.progress, [16, 20]);
  });

  it('retains the explicitly disabled minimum tail size', async function () {
    var result = await collectChunks({ chunkSize: 16, minChunkSize: false }, 17);
    assert.deepStrictEqual(result.chunks, [16, 1]);
    assert.deepStrictEqual(result.progress, [16, 17]);
  });

  [25, 50].forEach(function (rate) {
    it('finishes output across short accounting windows at a rate of ' + rate, function () {
      var moduleURL = new URL('../../../lib/helpers/AxiosTransformStream.js', import.meta.url).href;
      var source = [
        'import Transform from ' + JSON.stringify(moduleURL) + ';',
        'var started = Date.now();',
        'var stream = new Transform({maxRate: ' + rate + ', timeWindow: 20});',
        'var chunks = [];',
        'stream.on("data", function(chunk) {',
        '  chunks.push({bytes: chunk.length, elapsed: Date.now() - started});',
        '});',
        'stream.on("error", function(error) { throw error; });',
        'stream.on("end", function() { console.log(JSON.stringify(chunks)); });',
        'stream.end(Buffer.alloc(5));',
      ].join('\n');

      return new Promise(function (resolve, reject) {
        execFile(
          process.execPath,
          ['--input-type=module', '-e', source],
          { timeout: 3000, killSignal: 'SIGKILL' },
          function (error, stdout) {
            if (error) return reject(error);
            try {
              var chunks = JSON.parse(stdout);
              assert.ok(chunks.length > 1);
              assert.strictEqual(chunks[0].bytes, 1);
              assert.ok(chunks[1].elapsed >= 20);
              assert.strictEqual(
                chunks.reduce(function (bytes, chunk) {
                  return bytes + chunk.bytes;
                }, 0),
                5
              );
              resolve();
            } catch (failure) {
              reject(failure);
            }
          }
        );
      });
    });
  });
});
