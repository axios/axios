import assert from 'assert';
import matchOrigins from '../../../lib/helpers/matchOrigin.js';

describe('helpers::matchOrigins', function () {
  describe('protocol part', () => {
    it('should return true if the URL protocol matches the origin', function () {
      assert.strictEqual(matchOrigins('http://foo.com', 'http://foo.com'), true);
      assert.strictEqual(matchOrigins('http://foo.com', 'http:foo.com'), true);
      assert.strictEqual(matchOrigins('http://foo.com', 'foo.com'), true);
      assert.strictEqual(matchOrigins('foo.com', 'foo.com'), true);
      assert.strictEqual(matchOrigins('https://foo.com', 'http|https://foo.com'), true);
      assert.strictEqual(matchOrigins('https://foo.com', 'https://**'), true);
    });

    it('should return false if the URL protocol does not match the origin', function () {
      assert.strictEqual(matchOrigins('http://foo.com', 'https://foo.com'), false);
      assert.strictEqual(matchOrigins('foo.com', 'https://foo.com'), false);
      assert.strictEqual(matchOrigins('ftp://foo.com', 'http|https://foo.com'), false);
    });
  });

  describe('host part', () => {
    it('should return true if the URL host matches the origin', function () {
      assert.strictEqual(matchOrigins('http://foo.com', 'foo.com'), true);
      assert.strictEqual(matchOrigins('http://bar.com', 'foo|bar.com'), true);
      assert.strictEqual(matchOrigins('foo.com/bar', 'foo.com/does/not/matter'), true);
      assert.strictEqual(matchOrigins('foo.com', '*.com'), true);
      assert.strictEqual(matchOrigins('foo.bar.com', '*.*.com'), true);
      assert.strictEqual(matchOrigins('foo.bar.com', '*.bar.com'), true);
      assert.strictEqual(matchOrigins('foo.bar.com', '**.com'), true);
      assert.strictEqual(matchOrigins('foo.bar.com', '**.bar.com'), true);
      assert.strictEqual(matchOrigins('localhost', '*'), true);
      assert.strictEqual(matchOrigins('foo.bar.com', '**'), true);
    });

    it('should throw an error if the double wildcard is not at the beginning', () => {
      assert.throws(() => {
        assert.strictEqual(matchOrigins('foo.bar.com', 'bar.**.com'), true);
      }, /can only appear at the beginning/);
    });

    it('should return false if the URL host does not match the origin', function () {
      assert.strictEqual(matchOrigins('foo.com', 'bar.com'), false);
      assert.strictEqual(matchOrigins('foo.com', 'bar|baz.com'), false);
      assert.strictEqual(matchOrigins('foo.bar.com', '*.com'), false);
    });
  });

  describe('port part', () => {
    it('should return true if the URL port matches the origin', function () {
      assert.strictEqual(matchOrigins('foo.com', 'foo.com:80'), true);
      assert.strictEqual(matchOrigins('foo.com:3000', 'foo.com:3000'), true);
      assert.strictEqual(matchOrigins('foo.com:5000', 'foo.com:3000|5000'), true);
      assert.strictEqual(matchOrigins('http://foo.com', 'foo.com:80'), true);
      assert.strictEqual(matchOrigins('https://foo.com', 'foo.com:443'), true);

    });

    it('should return false if the URL port does not match the origin', function () {
      assert.strictEqual(matchOrigins('http://foo.com', 'foo.com:443'), false);
      assert.strictEqual(matchOrigins('foo.com', 'foo.com:443'), false);
      assert.strictEqual(matchOrigins('foo.com:3000', 'foo.com:8000'), false);
    });
  });
});
