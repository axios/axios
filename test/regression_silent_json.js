
import assert from 'assert';
import axios from '../index.js';

describe('Regression: Silent JSON Parsing', function () {

    beforeEach(function () {
        // Mock adapter to return invalid JSON
        axios.defaults.adapter = async (config) => {
            return {
                data: '{ invalid json }',
                status: 200,
                statusText: 'OK',
                headers: {},
                config
            };
        };
    });

    afterEach(function () {
        delete axios.defaults.adapter;
    });

    it('should throw SyntaxError when silentJSONParsing is false', async function () {
        try {
            await axios.get('/test', {
                transitional: {
                    silentJSONParsing: false
                }
            });
            assert.fail('Should have thrown error');
        } catch (err) {
            assert.ok(err.name === 'SyntaxError' || err.code === 'ERR_BAD_RESPONSE', 'Error should be SyntaxError or ERR_BAD_RESPONSE');
        }
    });

    it('should return raw string when silentJSONParsing is true (default)', async function () {
        const response = await axios.get('/test', {
            transitional: {
                silentJSONParsing: true
            }
        });
        assert.strictEqual(response.data, '{ invalid json }');
    });

    it('should throw SyntaxError when responseType is json (legacy behavior)', async function () {
        try {
            await axios.get('/test', {
                responseType: 'json',
                transitional: {
                    silentJSONParsing: false
                }
            });
            assert.fail('Should have thrown error');
        } catch (err) {
            assert.ok(err.name === 'SyntaxError' || err.code === 'ERR_BAD_RESPONSE', 'Error should be SyntaxError or ERR_BAD_RESPONSE');
        }
    });

    it('should swallow error when silentJSONParsing is true and responseType is json (legacy behavior)', async function () {
        const response = await axios.get('/test', {
            responseType: 'json',
            transitional: {
                silentJSONParsing: true
            }
        });
        assert.strictEqual(response.data, '{ invalid json }');
    });
});
