import { describe, it } from 'vitest';
import assert from 'assert';
import axios from '../../../index.js';
import { startHTTPServer, stopHTTPServer, SERVER_HANDLER_STREAM_ECHO } from '../../setup/server.js';

describe('helpers::toURLEncodedForm', () => {
  async function postForm(data, formSerializer) {
    const server = await startHTTPServer(SERVER_HANDLER_STREAM_ECHO);

    try {
      const response = await axios.post(`http://localhost:${server.address().port}/`, data, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        formSerializer,
      });

      return Array.from(new URLSearchParams(response.data));
    } finally {
      await stopHTTPServer(server);
    }
  }

  it('should preserve root Buffer encoding and ordinary nested fields', async () => {
    const fields = await postForm({
      file: Buffer.from([0, 255, 16]),
      user: { name: 'Ada' },
    });

    assert.deepStrictEqual(fields, [
      ['file', 'AP8Q'],
      ['user[name]', 'Ada'],
    ]);
  });

  it('should preserve distinct parent paths for nested Buffers', async () => {
    const fields = await postForm({
      first: { file: Buffer.from('abc') },
      second: { file: Buffer.from('xyz') },
      deep: { nested: { file: Buffer.from([0, 255, 16]) } },
    });

    assert.deepStrictEqual(fields, [
      ['first[file]', 'YWJj'],
      ['second[file]', 'eHl6'],
      ['deep[nested][file]', 'AP8Q'],
    ]);
  });

  it('should preserve array indexes in nested Buffer paths', async () => {
    const fields = await postForm({
      users: [{ file: Buffer.from('abc') }, { file: Buffer.from('xyz') }],
    });

    assert.deepStrictEqual(fields, [
      ['users[0][file]', 'YWJj'],
      ['users[1][file]', 'eHl6'],
    ]);
  });

  it('should respect dot notation for nested Buffers', async () => {
    const fields = await postForm(
      { user: { file: Buffer.from('abc') }, users: [{ file: Buffer.from('xyz') }] },
      { dots: true }
    );

    assert.deepStrictEqual(fields, [
      ['user.file', 'YWJj'],
      ['users.0.file', 'eHl6'],
    ]);
  });

  it('should preserve a custom form visitor', async () => {
    const fields = await postForm(
      { user: { file: Buffer.from('abc') } },
      {
        visitor(value, key, path, helpers) {
          if (Buffer.isBuffer(value)) {
            this.append(path.concat(key).join('.'), value.toString('hex'));
            return false;
          }

          return helpers.defaultVisitor.apply(this, arguments);
        },
      }
    );

    assert.deepStrictEqual(fields, [['user.file', '616263']]);
  });
});
