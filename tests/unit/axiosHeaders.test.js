import { describe, it } from 'vitest';
import assert from 'assert';
import AxiosHeaders from '../../lib/core/AxiosHeaders.js';

const [nodeMajorVersion] = process.versions.node.split('.').map((v) => parseInt(v, 10));

describe('AxiosHeaders', () => {
  it('should support headers argument', () => {
    const headers = new AxiosHeaders({
      x: 1,
      y: 2,
    });

    assert.strictEqual(headers.get('x'), '1');
    assert.strictEqual(headers.get('y'), '2');
  });

  describe('set', () => {
    it('should support adding a single header', () => {
      const headers = new AxiosHeaders();

      headers.set('foo', 'bar');

      assert.strictEqual(headers.get('foo'), 'bar');
    });

    it('should support adding multiple headers', () => {
      const headers = new AxiosHeaders();

      headers.set({
        foo: 'value1',
        bar: 'value2',
      });

      assert.strictEqual(headers.get('foo'), 'value1');
      assert.strictEqual(headers.get('bar'), 'value2');
    });

    it('should support adding multiple headers from raw headers string', () => {
      const headers = new AxiosHeaders();

      headers.set(`foo:value1\nbar:value2`);

      assert.strictEqual(headers.get('foo'), 'value1');
      assert.strictEqual(headers.get('bar'), 'value2');
    });

    it('should not rewrite header the header if the value is false', () => {
      const headers = new AxiosHeaders();

      headers.set('foo', 'value1');

      headers.set('foo', 'value2', false);

      assert.strictEqual(headers.get('foo'), 'value1');

      headers.set('foo', 'value2');

      assert.strictEqual(headers.get('foo'), 'value2');

      headers.set('foo', 'value3', true);

      assert.strictEqual(headers.get('foo'), 'value3');
    });

    it('should not rewrite the header if its value is false, unless rewrite options is set to true', () => {
      const headers = new AxiosHeaders();

      headers.set('foo', false);
      headers.set('foo', 'value2');

      assert.strictEqual(headers.get('foo'), false);

      headers.set('foo', 'value2', true);

      assert.strictEqual(headers.get('foo'), 'value2');
    });

    it('should support iterables as a key-value source object', () => {
      const headers = new AxiosHeaders();

      headers.set(new Map([['x', '123']]));

      assert.strictEqual(headers.get('x'), '123');
    });

    const runIfNode18OrHigher = nodeMajorVersion >= 18 ? it : it.skip;
    runIfNode18OrHigher('should support setting multiple header values from an iterable source', () => {
      const headers = new AxiosHeaders();
      const nativeHeaders = new Headers();

      nativeHeaders.append('set-cookie', 'foo');
      nativeHeaders.append('set-cookie', 'bar');
      nativeHeaders.append('set-cookie', 'baz');
      nativeHeaders.append('y', 'qux');

      headers.set(nativeHeaders);

      assert.deepStrictEqual(headers.get('set-cookie'), ['foo', 'bar', 'baz']);
      assert.strictEqual(headers.get('y'), 'qux');
    });
  });

  it('should support uppercase name mapping for names overlapped by class methods', () => {
    const headers = new AxiosHeaders({
      set: 'foo',
    });

    headers.set('get', 'bar');

    assert.strictEqual(headers.get('Set'), 'foo');
    assert.strictEqual(headers.get('Get'), 'bar');
  });

  describe('get', () => {
    describe('filter', () => {
      it('should support RegExp', () => {
        const headers = new AxiosHeaders();

        headers.set('foo', 'bar=value1');

        assert.strictEqual(headers.get('foo', /^bar=(\w+)/)[1], 'value1');
        assert.strictEqual(headers.get('foo', /^foo=/), null);
      });

      it('should support function', () => {
        const headers = new AxiosHeaders();

        headers.set('foo', 'bar=value1');

        assert.strictEqual(
          headers.get('foo', (value, header) => {
            assert.strictEqual(value, 'bar=value1');
            assert.strictEqual(header, 'foo');
            return value;
          }),
          'bar=value1'
        );
        assert.strictEqual(
          headers.get('foo', () => false),
          false
        );
      });
    });
  });

  describe('has', () => {
    it('should return true if the header is defined, otherwise false', () => {
      const headers = new AxiosHeaders();

      headers.set('foo', 'bar=value1');

      assert.strictEqual(headers.has('foo'), true);
      assert.strictEqual(headers.has('bar'), false);
    });

    describe('filter', () => {
      it('should support RegExp', () => {
        const headers = new AxiosHeaders();

        headers.set('foo', 'bar=value1');

        assert.strictEqual(headers.has('foo', /^bar=(\w+)/), true);
        assert.strictEqual(headers.has('foo', /^foo=/), false);
      });

      it('should support function', () => {
        const headers = new AxiosHeaders();

        headers.set('foo', 'bar=value1');

        assert.strictEqual(
          headers.has('foo', (value, header) => {
            assert.strictEqual(value, 'bar=value1');
            assert.strictEqual(header, 'foo');
            return true;
          }),
          true
        );
        assert.strictEqual(
          headers.has('foo', () => false),
          false
        );
      });

      it('should support string pattern', () => {
        const headers = new AxiosHeaders();

        headers.set('foo', 'bar=value1');

        assert.strictEqual(headers.has('foo', 'value1'), true);
        assert.strictEqual(headers.has('foo', 'value2'), false);
      });
    });
  });

  describe('delete', () => {
    it('should delete the header', () => {
      const headers = new AxiosHeaders();

      headers.set('foo', 'bar=value1');

      assert.strictEqual(headers.has('foo'), true);

      headers.delete('foo');

      assert.strictEqual(headers.has('foo'), false);
    });

    it('should return true if the header has been deleted, otherwise false', () => {
      const headers = new AxiosHeaders();

      headers.set('foo', 'bar=value1');

      assert.strictEqual(headers.delete('bar'), false);

      assert.strictEqual(headers.delete('foo'), true);
    });

    it('should support headers array', () => {
      const headers = new AxiosHeaders();

      headers.set('foo', 'x');
      headers.set('bar', 'y');
      headers.set('baz', 'z');

      assert.strictEqual(headers.delete(['foo', 'baz']), true);

      assert.strictEqual(headers.has('foo'), false);
      assert.strictEqual(headers.has('bar'), true);
      assert.strictEqual(headers.has('baa'), false);
    });

    describe('filter', () => {
      it('should support RegExp', () => {
        const headers = new AxiosHeaders();

        headers.set('foo', 'bar=value1');

        assert.strictEqual(headers.has('foo'), true);

        headers.delete('foo', /baz=/);

        assert.strictEqual(headers.has('foo'), true);

        headers.delete('foo', /bar=/);

        assert.strictEqual(headers.has('foo'), false);
      });

      it('should support function', () => {
        const headers = new AxiosHeaders();

        headers.set('foo', 'bar=value1');

        headers.delete('foo', (value, header) => {
          assert.strictEqual(value, 'bar=value1');
          assert.strictEqual(header, 'foo');
          return false;
        });

        assert.strictEqual(headers.has('foo'), true);

        assert.strictEqual(
          headers.delete('foo', () => true),
          true
        );

        assert.strictEqual(headers.has('foo'), false);
      });

      it('should support string pattern', () => {
        const headers = new AxiosHeaders();

        headers.set('foo', 'bar=value1');

        assert.strictEqual(headers.has('foo'), true);

        headers.delete('foo', 'baz');

        assert.strictEqual(headers.has('foo'), true);

        headers.delete('foo', 'bar');

        assert.strictEqual(headers.has('foo'), false);
      });
    });
  });

  describe('clear', () => {
    it('should clear all headers', () => {
      const headers = new AxiosHeaders({ x: 1, y: 2 });

      headers.clear();

      assert.deepStrictEqual({ ...headers.toJSON() }, {});
    });

    it('should clear matching headers if a matcher was specified', () => {
      const headers = new AxiosHeaders({ foo: 1, 'x-foo': 2, bar: 3 });

      assert.deepStrictEqual({ ...headers.toJSON() }, { foo: '1', 'x-foo': '2', bar: '3' });

      headers.clear(/^x-/);

      assert.deepStrictEqual({ ...headers.toJSON() }, { foo: '1', bar: '3' });
    });
  });

  describe('toJSON', () => {
    it('should return headers object with original headers case', () => {
      const headers = new AxiosHeaders({
        Foo: 'x',
        bAr: 'y',
      });

      assert.deepStrictEqual(
        { ...headers.toJSON() },
        {
          Foo: 'x',
          bAr: 'y',
        }
      );
    });
  });

  describe('accessors', () => {
    it('should support get accessor', () => {
      const headers = new AxiosHeaders({
        foo: 1,
      });

      headers.constructor.accessor('foo');

      assert.strictEqual(typeof headers.getFoo, 'function');
      assert.strictEqual(headers.getFoo(), '1');
    });

    it('should support set accessor', () => {
      const headers = new AxiosHeaders({
        foo: 1,
      });

      headers.constructor.accessor('foo');

      assert.strictEqual(typeof headers.setFoo, 'function');
      headers.setFoo(2);
      assert.strictEqual(headers.getFoo(), '2');
    });

    it('should support has accessor', () => {
      const headers = new AxiosHeaders({
        foo: 1,
      });

      headers.constructor.accessor('foo');

      assert.strictEqual(typeof headers.hasFoo, 'function');
      assert.strictEqual(headers.hasFoo(), true);
    });
  });

  it('should be caseless', () => {
    const headers = new AxiosHeaders({
      fOo: 1,
    });

    assert.strictEqual(headers.get('Foo'), '1');
    assert.strictEqual(headers.get('foo'), '1');

    headers.set('foo', 2);

    assert.strictEqual(headers.get('foO'), '2');
    assert.strictEqual(headers.get('fOo'), '2');

    assert.strictEqual(headers.has('fOo'), true);

    headers.delete('FOO');

    assert.strictEqual(headers.has('fOo'), false);
  });

  describe('normalize()', () => {
    it('should support auto-formatting', () => {
      const headers = new AxiosHeaders({
        fOo: 1,
        'x-foo': 2,
        'y-bar-bAz': 3,
      });

      assert.deepStrictEqual(
        { ...headers.normalize(true).toJSON() },
        {
          Foo: '1',
          'X-Foo': '2',
          'Y-Bar-Baz': '3',
        }
      );
    });

    it('should support external defined values', () => {
      const headers = new AxiosHeaders({
        foo: '1',
      });

      headers.Foo = 2;
      headers.bar = 3;

      assert.deepStrictEqual(
        { ...headers.normalize().toJSON() },
        {
          foo: '2',
          bar: '3',
        }
      );
    });

    it('should support array values', () => {
      const headers = new AxiosHeaders({
        foo: [1, 2, 3],
      });

      assert.deepStrictEqual(
        { ...headers.normalize().toJSON() },
        {
          foo: ['1', '2', '3'],
        }
      );
    });
  });

  describe('AxiosHeaders.concat', () => {
    it('should concatenate plain headers into an AxiosHeader instance', () => {
      const a = { a: 1 };
      const b = { b: 2 };
      const c = { c: 3 };
      const headers = AxiosHeaders.concat(a, b, c);

      assert.deepStrictEqual(
        { ...headers.toJSON() },
        {
          a: '1',
          b: '2',
          c: '3',
        }
      );
    });

    it('should concatenate raw headers into an AxiosHeader instance', () => {
      const a = 'a:1\nb:2';
      const b = 'c:3\nx:4';
      const headers = AxiosHeaders.concat(a, b);

      assert.deepStrictEqual(
        { ...headers.toJSON() },
        {
          a: '1',
          b: '2',
          c: '3',
          x: '4',
        }
      );
    });

    it('should concatenate Axios headers into a new AxiosHeader instance', () => {
      const a = new AxiosHeaders({ x: 1 });
      const b = new AxiosHeaders({ y: 2 });
      const headers = AxiosHeaders.concat(a, b);

      assert.deepStrictEqual(
        { ...headers.toJSON() },
        {
          x: '1',
          y: '2',
        }
      );
    });
  });

  describe('toString', () => {
    it('should serialize AxiosHeader instance to a raw headers string', () => {
      assert.deepStrictEqual(new AxiosHeaders({ x: 1, y: 2 }).toString(), 'x: 1\ny: 2');
    });
  });

  describe('getSetCookie', () => {
    it('should return set-cookie', () => {
      const headers = new AxiosHeaders('Set-Cookie: key=val;\n' + 'Set-Cookie: key2=val2;\n');

      assert.deepStrictEqual(headers.getSetCookie(), ['key=val;', 'key2=val2;']);
    });

    it('should return empty set-cookie', () => {
      assert.deepStrictEqual(new AxiosHeaders().getSetCookie(), []);
    });
  });
});
