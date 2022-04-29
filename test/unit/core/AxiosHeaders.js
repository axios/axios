var AxiosHeaders = require('../../../lib/core/AxiosHeaders');
var assert = require('assert');


describe('AxiosHeaders', function () {
  it('should support headers argument', function () {
    var headers = new AxiosHeaders({
      x: 1,
      y: 2
    });

    assert.strictEqual(headers.get('x'), '1');
    assert.strictEqual(headers.get('y'), '2');
  })


  describe('set', function () {
    it('should support adding a single header', function(){
      var headers = new AxiosHeaders();

      headers.set('foo', 'bar');

      assert.strictEqual(headers.get('foo'), 'bar');
    })

    it('should support adding multiple headers', function(){
      var headers = new AxiosHeaders();

      headers.set({
        foo: 'value1',
        bar: 'value2',
      });

      assert.strictEqual(headers.get('foo'), 'value1');
      assert.strictEqual(headers.get('bar'), 'value2');
    })

    it('should rewrite header only if rewrite option is set to true or undefined', function(){
      var headers = new AxiosHeaders();

      headers.set('foo', 'value1');

      headers.set('foo', 'value2', false);

      assert.strictEqual(headers.get('foo'), 'value1');

      headers.set('foo', 'value2');

      assert.strictEqual(headers.get('foo'), 'value2');

      headers.set('foo', 'value3', true);

      assert.strictEqual(headers.get('foo'), 'value3');
    });

    it('should not rewrite the header if its value is false, unless rewrite options is set to true', function(){
      var headers = new AxiosHeaders();

      headers.set('foo', false);
      headers.set('foo', 'value2');

      assert.strictEqual(headers.get('foo'), false);

      headers.set('foo', 'value2', true);

      assert.strictEqual(headers.get('foo'), 'value2');
    })
  });

  describe('get', function () {
    describe('filter', function() {
      it('should support RegExp', function () {
        const headers = new AxiosHeaders();

        headers.set('foo', 'bar=value1');

        assert.strictEqual(headers.get('foo', /^bar=(\w+)/)[1], 'value1');
        assert.strictEqual(headers.get('foo', /^foo=/), null);
      });

      it('should support function', function () {
        const headers = new AxiosHeaders();

        headers.set('foo', 'bar=value1');

        assert.strictEqual(headers.get('foo', (value, header) => {
          assert.strictEqual(value, 'bar=value1');
          assert.strictEqual(header, 'foo');
          return true;
        }), 'bar=value1');
        assert.strictEqual(headers.get('foo', () => false), null);
      });
    });
  });

  describe('has', function () {
    it('should return true if the header is defined, otherwise false', function () {
      const headers = new AxiosHeaders();

      headers.set('foo', 'bar=value1');

      assert.strictEqual(headers.has('foo'), true);
      assert.strictEqual(headers.has('bar'), false);
    });

    describe('filter', function () {
      it('should support RegExp', function () {
        const headers = new AxiosHeaders();

        headers.set('foo', 'bar=value1');

        assert.strictEqual(headers.has('foo', /^bar=(\w+)/), true);
        assert.strictEqual(headers.has('foo', /^foo=/), false);
      });

      it('should support function', function () {
        const headers = new AxiosHeaders();

        headers.set('foo', 'bar=value1');

        assert.strictEqual(headers.has('foo', (value, header, headers)=> {
          assert.strictEqual(value, 'bar=value1');
          assert.strictEqual(header, 'foo');
          return true;
        }), true);
        assert.strictEqual(headers.has('foo', ()=> false), false);
      });

      it('should support string pattern', function () {
        const headers = new AxiosHeaders();

        headers.set('foo', 'bar=value1');

        assert.strictEqual(headers.has('foo', 'value1'), true);
        assert.strictEqual(headers.has('foo', 'value2'), false);
      });
    });
  });

  describe('delete', function () {
    it('should delete the header', function () {
      const headers = new AxiosHeaders();

      headers.set('foo', 'bar=value1');

      assert.strictEqual(headers.has('foo'), true);

      headers.delete('foo');

      assert.strictEqual(headers.has('foo'), false);
    });

    it('should return true if the header has been deleted, otherwise false', function () {
      const headers = new AxiosHeaders();

      headers.set('foo', 'bar=value1');

      assert.strictEqual(headers.delete('bar'), false);

      assert.strictEqual(headers.delete('foo'), true);
    });

    it('should support headers array', function () {
      const headers = new AxiosHeaders();

      headers.set('foo', 'x');
      headers.set('bar', 'y');
      headers.set('baz', 'z');

      assert.strictEqual(headers.delete(['foo', 'baz']), true);

      assert.strictEqual(headers.has('foo'), false);
      assert.strictEqual(headers.has('bar'), true);
      assert.strictEqual(headers.has('baa'), false);
    });

    describe('filter', function () {
      it('should support RegExp', function () {
        const headers = new AxiosHeaders();

        headers.set('foo', 'bar=value1');

        assert.strictEqual(headers.has('foo'), true);

        headers.delete('foo', /baz=/);

        assert.strictEqual(headers.has('foo'), true);

        headers.delete('foo', /bar=/);

        assert.strictEqual(headers.has('foo'), false);
      });

      it('should support function', function () {
        const headers = new AxiosHeaders();

        headers.set('foo', 'bar=value1');

        headers.delete('foo', (value, header)=> {
          assert.strictEqual(value, 'bar=value1');
          assert.strictEqual(header, 'foo');
          return false;
        });

        assert.strictEqual(headers.has('foo'), true);

        assert.strictEqual(headers.delete('foo', ()=> true), true);

        assert.strictEqual(headers.has('foo'), false);
      });

      it('should support string pattern', function () {
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

  describe('toJSON', function () {
    it('should return headers object with original headers case', function () {
      const headers = new AxiosHeaders({
        Foo: 'x',
        bAr: 'y'
      });

      assert.deepStrictEqual({...headers.toJSON()}, {
        Foo: 'x',
        bAr: 'y'
      });
    });
  });

  describe('accessors', function () {
    it('should support get accessor', function () {
      const headers = new AxiosHeaders({
        foo: 1
      });

      headers.accessor();

      assert.strictEqual(typeof headers.getFoo, 'function');
      assert.strictEqual(headers.getFoo(), '1');
    });

    it('should support set accessor', function () {
      const headers = new AxiosHeaders({
        foo: 1
      });

      headers.accessor();

      assert.strictEqual(typeof headers.setFoo, 'function');
      headers.setFoo(2);
      assert.strictEqual(headers.getFoo(), '2');
    });
  });

  it('should be caseless', function () {
    const headers = new AxiosHeaders({
      fOo: 1
    });

    headers.accessor();

    assert.strictEqual(headers.get('Foo'), '1');
    assert.strictEqual(headers.get('foo'), '1');

    headers.set('foo', 2);

    assert.strictEqual(headers.get('foO'), '2');
    assert.strictEqual(headers.get('fOo'), '2');

    assert.strictEqual(headers.has('fOo'), true);

    headers.delete('FOO');

    assert.strictEqual(headers.has('fOo'), false);

  });

  describe('normalize()', function () {
    it('should support auto-formatting', function () {
      const headers = new AxiosHeaders({
        fOo: 1,
        'x-foo': 2,
        'y-bar-bAz': 3
      });

      assert.deepStrictEqual({...headers.normalize().toJSON()}, {
        Foo: '1',
        'X-Foo': '2',
        'Y-Bar-Baz': '3'
      });
    });
  });

  describe('AxiosHeader.parse', function () {
    it('should parse headers', function () {
      var date = new Date();
      var headers = AxiosHeaders.parse(
        'Date: ' + date.toISOString() + '\n' +
        'Content-Type: application/json\n' +
        'Connection: keep-alive\n' +
        'Transfer-Encoding: chunked'
      );

      assert.strictEqual(headers.get('date'), date.toISOString());
      assert.strictEqual(headers.get('content-type'),'application/json');
      assert.strictEqual(headers.get('connection'),'keep-alive');
      assert.strictEqual(headers.get('transfer-encoding'),'chunked');
    });

    it('should use array for set-cookie', function() {
      var parsedZero = AxiosHeaders.parse('');
      var parsedSingle = AxiosHeaders.parse(
        'Set-Cookie: key=val;'
      );
      var parsedMulti = AxiosHeaders.parse(
        'Set-Cookie: key=val;\n' +
        'Set-Cookie: key2=val2;\n'
      );

      assert.strictEqual(parsedZero.get('set-cookie'), undefined);
      assert.deepStrictEqual(parsedSingle.get('set-cookie'), ['key=val;']);
      assert.deepStrictEqual(parsedMulti.get('set-cookie'),['key=val;', 'key2=val2;']);
    });

    it('should handle duplicates', function() {
      var parsed = AxiosHeaders.parse(
        'Age: age-a\n' + // age is in ignore duplicates blocklist
        'Age: age-b\n' +
        'Foo: foo-a\n' +
        'Foo: foo-b\n'
      );

      assert.strictEqual(parsed.get('age'),'age-a');
      assert.strictEqual(parsed.get('foo'),'foo-a, foo-b');
    });
  });

});
