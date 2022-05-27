var defaults = require('../../../lib/defaults');
var transformData = require('../../../lib/core/transformData');
var assert = require('assert');

describe('transformResponse', function () {
    describe('200 request', function () {
        it('parses json', function () {
            var data = '{"message": "hello, world"}';
            var result = transformData.call({
                data,
                response: {
                    headers: {'content-type': 'application/json'},
                    status: 200
                }
            }, defaults.transformResponse);
            assert.strictEqual(result.message, 'hello, world');
        });
        it('ignores XML', function () {
            var data = '<message>hello, world</message>';
            var result = transformData.call({
                data,
                response: {
                    headers: {'content-type': 'text/xml'},
                    status: 200
                }
            }, defaults.transformResponse);
            assert.strictEqual(result, data);
        });
    });
    describe('204 request', function () {
        it('does not parse the empty string', function () {
            var data = '';
            var result = transformData.call({
                data,
                response: {
                    headers: {'content-type': undefined},
                    status: 204
                }
            }, defaults.transformResponse);
            assert.strictEqual(result, '');
        });
        it('does not parse undefined', function () {
            var data = undefined;
            var result = transformData.call({
                data,
                response: {
                    headers: {'content-type': undefined},
                    status: 200
                }
            }, defaults.transformResponse);
            assert.strictEqual(result, data);
        });
    });
});
