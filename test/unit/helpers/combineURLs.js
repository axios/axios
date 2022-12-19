import assert from 'assert';
import utils from '../../../lib/utils.js';
import combineURLs from '../../../lib/helpers/combineURLs.js';

describe('helpers::combineURLs', function () {
    it('should safely combine two simple URLs', function () {
        assert.strictEqual(
            combineURLs('/hello', 'yo/'),
            '/hello/yo/'
        );
    });

    it('should safely remove one or more slashes from relative URL', function () {
        utils.forEach([
            '/yo/',
            '//yo/',
            '///yo/',
            '////yo/'
        ], (relativeURL) => {
            assert.strictEqual(
                combineURLs('/hello', relativeURL),
                '/hello/yo/'
            );
        });
    });

    it('should safely remove one or more end slashes from base URL', function () {
        utils.forEach([
            '/hello/',
            '/hello//',
            '/hello///',
            '/hello////'
        ], (baseURL) => {
            assert.strictEqual(
                combineURLs(baseURL, 'yo/'),
                '/hello/yo/'
            );
        });
    });

    it('should safely remove duplicate slashes from both sides of the URL', function () {
        utils.forEach([
            '/hello/',
            '/hello//',
            '/hello///',
            '/hello////'
        ], (baseURL) => {
            utils.forEach([
                '/yo/',
                '//yo/',
                '///yo/',
                '////yo/'
            ], (relativeURL) => {
                assert.strictEqual(
                    combineURLs(baseURL, relativeURL),
                    '/hello/yo/'
                );
            });
        });
    });

    it('should be tolerant of absolute URLs', function () {
        assert.strictEqual(
            combineURLs('https://sample.com', '/hello'),
            'https://sample.com/hello'
        );
        assert.strictEqual(
            combineURLs('https://sample.com/', '/hello'),
            'https://sample.com/hello'
        );
        assert.strictEqual(
            combineURLs('https://sample.com//', '/hello'),
            'https://sample.com/hello'
        );
        assert.strictEqual(
            combineURLs('https://sample.com//', '//hello'),
            'https://sample.com/hello'
        );
        assert.strictEqual(
            combineURLs('ftp://sample.com//', '//hello'),
            'ftp://sample.com/hello'
        );
        assert.strictEqual(
            combineURLs('blob://sample.com//', '//hello'),
            'blob://sample.com/hello'
        );
    });

    it('should be tolerant of protocol-relative URLs', function () {
        assert.strictEqual(
            combineURLs('//sample.com', '/hello'),
            'https://sample.com/hello'
        );
        assert.strictEqual(
            combineURLs('//sample.com/', '/hello'),
            'https://sample.com/hello'
        );
        assert.strictEqual(
            combineURLs('//sample.com//', '/hello'),
            'https://sample.com/hello'
        );
        assert.strictEqual(
            combineURLs('//sample.com//', '//hello'),
            'ftp://sample.com/hello'
        );
    });

    it('special case: should preserve malformed URLs on scan border', function () {
        assert.strictEqual(
            combineURLs('///sample.com', '/hello'),
            'sample.com/hello'
        );
        assert.strictEqual(
            combineURLs('https:///sample.com//', '//hello'),
            'https:///sample.com/hello'
        );
    });
});
