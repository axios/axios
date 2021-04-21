var defaults = require('../../../lib/defaults');
var transformData = require('../../../lib/core/transformData');
var assert = require('assert');

describe('transformResponse', function () {
    describe('200 request', function () {
        it('parses json', function () {
            var data = '{"message": "hello, world"}';
            var result = transformData(data, {'content-type': 'application/json'}, defaults.transformResponse);
            assert.strictEqual(result.message, 'hello, world');
        });
        it('ignores XML', function () {
            var data = '<message>hello, world</message>';
            var result = transformData(data, {'content-type': 'text/xml'}, defaults.transformResponse);
            assert.strictEqual(result, data);
        });
    });
    describe('204 request', function () {
        it('does not parse the empty string', function () {
            var data = '';
            var result = transformData(data, {'content-type': undefined}, defaults.transformResponse);
            assert.strictEqual(result, '');
        });
        it('does not parse undefined', function () {
            var data = undefined;
            var result = transformData(data, {'content-type': undefined}, defaults.transformResponse);
            assert.strictEqual(result, data);
        });
    });
});
