// https://security.snyk.io/vuln/SNYK-JS-AXIOS-7361793
// https://github.com/axios/axios/issues/6463

import axios from '../../../index.js';
import http from 'http';
import assert from 'assert';
import platform from '../../../lib/platform/index.js';


const GOOD_PORT = 4666;
const BAD_PORT = 4667;

describe('Server-Side Request Forgery (SSRF)', () => {
    let goodServer, badServer;

    beforeEach(() => {
        goodServer = http.createServer(function (req, res) {
            res.write('good');
            res.end();
        }).listen(GOOD_PORT);
        badServer = http.createServer(function (req, res) {
            res.write('bad');
            res.end();
        }).listen(BAD_PORT);
    })

    afterEach(() => {
        goodServer.close();
        badServer.close();
    });

    it('should not fetch in server-side mode', async () => {
        const ssrfAxios = axios.create({
            baseURL: 'http://localhost:' + String(GOOD_PORT),
        });

        // Good payload would be `userId = '12345'`
        // Malicious payload is as below.
        const userId = '/localhost:' + String(BAD_PORT);

        try {
            await ssrfAxios.get(`/${userId}`);
        } catch (error) {
            assert.ok(error.message.startsWith('Invalid URL'));
            return;
        }
        assert.fail('Expected an error to be thrown');
    });

    describe('should fetch in client-side mode', () => {
        let hasBrowserEnv, origin;

        before(() => {
            assert.ok(platform.hasBrowserEnv !== undefined);
            hasBrowserEnv = platform.hasBrowserEnv;
            origin = platform.origin;
            platform.hasBrowserEnv = true;
            platform.origin = 'http://localhost:' + String(GOOD_PORT);
        });
        after(() => {
            platform.hasBrowserEnv = hasBrowserEnv;
            platform.origin = origin;
        });
        it('should fetch in client-side mode', async () => {
            platform.hasBrowserEnv = true;
            const ssrfAxios = axios.create({
                baseURL: 'http://localhost:' + String(GOOD_PORT),
            });

            // Good payload would be `userId = '12345'`
            // Malicious payload is as below.
            const userId = '/localhost:' + String(BAD_PORT);

            const response = await ssrfAxios.get(`/${userId}`);
            assert.strictEqual(response.data, 'bad');
            assert.strictEqual(response.config.baseURL, 'http://localhost:' + String(GOOD_PORT));
            assert.strictEqual(response.config.url, '//localhost:' + String(BAD_PORT));
            assert.strictEqual(response.request.res.responseUrl, 'http://localhost:' + String(BAD_PORT) + '/');
        });
    });
});
