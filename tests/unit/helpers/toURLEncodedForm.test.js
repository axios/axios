import { describe, it } from 'vitest';
import assert from 'assert';
import axios from '../../../index.js';
import toURLEncodedForm from '../../../lib/helpers/toURLEncodedForm.js';
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

  // Test A: Two nested Buffers with identical leaf keys
  it('should preserve parent paths for two nested Buffers with identical leaf keys', () => {
    const data = {
      first: { file: Buffer.from('abc') },
      second: { file: Buffer.from('xyz') },
    };

    const entries = Array.from(toURLEncodedForm(data));

    assert.deepStrictEqual(entries, [
      ['first[file]', 'YWJj'],
      ['second[file]', 'eHl6'],
    ]);

    // Ensure neither Buffer is incorrectly serialized under bare "file" key
    assert.strictEqual(
      entries.some(([key]) => key === 'file'),
      false
    );
  });

  // Test B: Dot notation
  it('should respect dot notation throughout the nested path for nested Buffers', () => {
    const data = {
      first: { file: Buffer.from('abc') },
      second: { file: Buffer.from('xyz') },
    };

    const entries = Array.from(toURLEncodedForm(data, { dots: true }));

    assert.deepStrictEqual(entries, [
      ['first.file', 'YWJj'],
      ['second.file', 'eHl6'],
    ]);
  });

  // Test C: Deep nesting
  it('should preserve all parent path segments for deeply nested Buffers', () => {
    const data = {
      account: {
        attachments: {
          file: Buffer.from('abc'),
        },
      },
    };

    const bracketEntries = Array.from(toURLEncodedForm(data));
    assert.deepStrictEqual(bracketEntries, [['account[attachments][file]', 'YWJj']]);

    const dotEntries = Array.from(toURLEncodedForm(data, { dots: true }));
    assert.deepStrictEqual(dotEntries, [['account.attachments.file', 'YWJj']]);
  });

  // Test D: Three or more repeated leaf keys
  it('should preserve distinct paths when three or more branches have the same leaf key', () => {
    const data = {
      a: { file: Buffer.from('1') },
      b: { file: Buffer.from('2') },
      c: { file: Buffer.from('3') },
    };

    const entries = Array.from(toURLEncodedForm(data));

    assert.deepStrictEqual(entries, [
      ['a[file]', 'MQ=='],
      ['b[file]', 'Mg=='],
      ['c[file]', 'Mw=='],
    ]);

    assert.strictEqual(
      entries.some(([key]) => key === 'file'),
      false
    );
  });

  // Test E: Top-level Buffer compatibility
  it('should preserve top-level Buffer compatibility and ordinary nested fields', () => {
    const data = {
      file: Buffer.from([0, 255, 16]),
      user: { name: 'Ada' },
    };

    const entries = Array.from(toURLEncodedForm(data));

    assert.deepStrictEqual(entries, [
      ['file', 'AP8Q'],
      ['user[name]', 'Ada'],
    ]);
  });

  // Test F: Mixed data types
  it('should preserve nested Buffers alongside ordinary strings, numbers, booleans, and arrays', () => {
    const data = {
      name: 'test',
      count: 42,
      active: true,
      tags: ['alpha', 'beta'],
      nested: {
        file: Buffer.from('mixed'),
        description: 'doc',
      },
    };

    const entries = Array.from(toURLEncodedForm(data));

    assert.deepStrictEqual(entries, [
      ['name', 'test'],
      ['count', '42'],
      ['active', 'true'],
      ['tags[]', 'alpha'],
      ['tags[]', 'beta'],
      ['nested[file]', 'bWl4ZWQ='],
      ['nested[description]', 'doc'],
    ]);
  });

  // Test G: Empty and binary Buffers
  it('should handle empty Buffers and non-UTF-8 binary Buffers correctly', () => {
    const data = {
      empty: { file: Buffer.alloc(0) },
      binary: { file: Buffer.from([0, 255, 16]) },
      highBytes: { file: Buffer.from([0x00, 0xff, 0xfe, 0x10, 0x80]) },
    };

    const entries = Array.from(toURLEncodedForm(data));

    assert.deepStrictEqual(entries, [
      ['empty[file]', ''],
      ['binary[file]', 'AP8Q'],
      ['highBytes[file]', 'AP/+EIA='],
    ]);
  });

  it('should correctly ignore nullish fields alongside nested Buffers', () => {
    const data = {
      first: {
        file: Buffer.from('abc'),
        missing: undefined,
        empty: null,
      },
    };

    const entries = Array.from(toURLEncodedForm(data));

    assert.deepStrictEqual(entries, [['first[file]', 'YWJj']]);
  });

  it('should preserve paths for nested arrays containing Buffers', () => {
    const data = {
      list: {
        items: [Buffer.from('a'), Buffer.from('b')],
      },
    };

    const bracketEntries = Array.from(toURLEncodedForm(data));
    assert.deepStrictEqual(bracketEntries, [
      ['list[items][0]', 'YQ=='],
      ['list[items][1]', 'Yg=='],
    ]);

    const dotEntries = Array.from(toURLEncodedForm(data, { dots: true }));
    assert.deepStrictEqual(dotEntries, [
      ['list.items.0', 'YQ=='],
      ['list.items.1', 'Yg=='],
    ]);
  });

  // Test H: Serializer options (array indexes, dots, metaTokens, custom visitor)
  it('should preserve array indexes in nested Buffer paths', () => {
    const data = {
      users: [{ file: Buffer.from('abc') }, { file: Buffer.from('xyz') }],
    };

    const bracketEntries = Array.from(toURLEncodedForm(data));
    assert.deepStrictEqual(bracketEntries, [
      ['users[0][file]', 'YWJj'],
      ['users[1][file]', 'eHl6'],
    ]);

    const dotEntries = Array.from(toURLEncodedForm(data, { dots: true }));
    assert.deepStrictEqual(dotEntries, [
      ['users.0.file', 'YWJj'],
      ['users.1.file', 'eHl6'],
    ]);
  });

  it('should preserve custom form visitor option', () => {
    const data = { user: { file: Buffer.from('abc') } };

    const entries = Array.from(
      toURLEncodedForm(data, {
        visitor(value, key, path, helpers) {
          if (Buffer.isBuffer(value)) {
            this.append(path.concat(key).join('.'), value.toString('hex'));
            return false;
          }

          return helpers.defaultVisitor.apply(this, arguments);
        },
      })
    );

    assert.deepStrictEqual(entries, [['user.file', '616263']]);
  });

  // Test I: Real Axios request integration with local HTTP server
  it('should correctly serialize nested Buffers in an end-to-end Axios request', async () => {
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

  it('should respect dot notation in an end-to-end Axios request', async () => {
    const fields = await postForm(
      {
        user: { file: Buffer.from('abc') },
        users: [{ file: Buffer.from('xyz') }],
      },
      { dots: true }
    );

    assert.deepStrictEqual(fields, [
      ['user.file', 'YWJj'],
      ['users.0.file', 'eHl6'],
    ]);
  });

  it('should preserve top-level Buffer encoding in an end-to-end Axios request', async () => {
    const fields = await postForm({
      file: Buffer.from([0, 255, 16]),
      user: { name: 'Ada' },
    });

    assert.deepStrictEqual(fields, [
      ['file', 'AP8Q'],
      ['user[name]', 'Ada'],
    ]);
  });

  it('should preserve a custom form visitor in an end-to-end Axios request', async () => {
    // End-to-end custom-visitor override regression test adapted from PR #11290 by @imharjot
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
