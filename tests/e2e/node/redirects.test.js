import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {getStreamAsBuffer} from 'get-stream';
import {startHTTPServer, stopAllTrackedHTTPServers, stopHTTPServer} from "../../setup/server.js";
import axios from '../../../index.js';
import {setTimeoutAsync} from "../../setup/helpers.js";


describe('redirects', () => {
  afterEach(async () => {
    await stopAllTrackedHTTPServers();
  });

  [{
    adapter: 'http'
  }, {
    adapter: 'fetch'
  }, {
    httpVersion: 2,
    http2Options: {
      rejectUnauthorized: false
    },
    adapter: 'http'
  }].forEach((defaultConfig) => {
    describe(`Adapter [${defaultConfig.adapter}] [${defaultConfig.httpVersion === 2 ? 'HTTP/2' : 'HTTP/1.1'}]`, () => {
      const {httpVersion} = defaultConfig;

      const useHTTP2 = httpVersion === 2;
      const isFetch = defaultConfig.adapter === 'fetch';

      const axiosInstance = axios.create({
        ...defaultConfig,
        transitional: {
          useAxiosRedirects: true
        },
        httpVersion
      });

      it('should follow redirects', async () => {
        const server = await startHTTPServer((req, res) => {
          if (req.path === '/redirect') {
            res.writeHead(302, {Location: '/final'});
            res.end();
            return;
          }

          if (req.path === '/final') {
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end('Final Destination');
          }
        }, {useHTTP2});

        const response = await axiosInstance.get(server.origin + '/redirect');

        expect(response.status).toBe(200);
        expect(response.data).toBe('Final Destination');
      });

      it('should not follow redirects when maxRedirects is set to 0', async () => {
        const server = await startHTTPServer((req, res) => {
          if (req.path === '/redirect') {
            res.writeHead(302, {Location: '/final'});
            res.end();
            return;
          }

          if (req.path === '/final') {
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end('Final Destination');
          }
        }, {useHTTP2});


        try {
          await axiosInstance.get(`${server.origin}/redirect`, {
            maxRedirects: 0
          });

          expect.fail('Expected to throw an error due to maxRedirects set to 0');
        } catch (error) {
          expect(error.message).toMatch(/Maximum number of redirects exceeded/);
          expect(error.response).toBeDefined();
          expect(error.response.status).toBe(302);
          expect(error.response.headers.get('Location')).toBe('/final');
        }
      });

      it('should support beforeRedirect hook', async () => {
        const server = await startHTTPServer((req, res) => {
          if (req.path === '/redirect') {
            res.writeHead(302, {Location: '/final'});
            res.end();
            return;
          }

          if (req.path === '/final') {
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end('Final Destination');
          }
        }, {useHTTP2});

        const beforeRedirect = vi.fn();

        const response = await axiosInstance.get(`${server.origin}/redirect`, {
          beforeRedirect
        });

        expect(response.status).toBe(200);
        expect(response.data).toBe('Final Destination');
        expect(beforeRedirect).toHaveBeenCalled();
        const callArgs = beforeRedirect.mock.calls[0][0];
        expect(callArgs).toMatchObject({
          status: 302,
          url: new URL(`${server.origin}/redirect`),
          redirectTo: new URL(`${server.origin}/final`),
          redirectsCount: 0,
          maxRedirects: 21
        });
        expect(callArgs.headers).toBeDefined();
        expect(Object.prototype.toString.call(callArgs.headers)).toBe('[object AxiosHeaders]');
        expect(Object.prototype.toString.call(callArgs.response.headers)).toBe('[object AxiosHeaders]');
        expect(callArgs.response.headers.toJSON()).toMatchObject({
          location: '/final'
        });
        expect(callArgs.response.headers.get('Location')).toBe('/final');
      });


      it.skipIf(useHTTP2 || isFetch)('should use follow-redirects package when useAxiosRedirects is false', async () => {
        // follow-redirects package does not support HTTP/2, so we skip this test for HTTP/2 configuration

        const server = await startHTTPServer((req, res) => {
          if (req.path === '/redirect') {
            res.writeHead(302, {Location: '/final'});
            res.end();
            return;
          }

          if (req.path === '/final') {
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end('Final Destination');
          }
        }, {useHTTP2});

        const beforeRedirect = vi.fn();

        const response = await axiosInstance.get(`${server.origin}/redirect`, {
          beforeRedirect,
          transitional: {
            useAxiosRedirects: false
          }
        });

        expect(response.status).toBe(200);
        expect(response.data).toBe('Final Destination');
        expect(beforeRedirect).toHaveBeenCalled();
        const callArgs = beforeRedirect.mock.calls[0][0];

        expect(callArgs.agent).toBeDefined;
      })

      it('should support sending body with redirects', async () => {
        const server = await startHTTPServer((req, res) => {
          if (req.path === '/redirect') {
            res.writeHead(307, {Location: '/final'});
            res.end();
            return;
          }

          if (req.path === '/final') {
            let body = '';
            req.on('data', chunk => {
              body += chunk;
            });
            req.on('end', () => {
              res.writeHead(200, {'Content-Type': 'text/plain'});
              res.end(body);
            });
          }
        }, {useHTTP2});

        const response = await axiosInstance.post(`${server.origin}/redirect`, 'Test Body');

        expect(response.status).toBe(200);
        expect(response.data).toBe('Test Body');
      });

      it('should support sending async iterable (stream) body with redirects', async () => {
        const server = await startHTTPServer((req, res) => {
          if (req.path === '/redirect') {
            res.writeHead(307, {Location: '/final'});
            res.end();
            return;
          }

          if (req.path === '/final') {
            let body = '';
            req.on('data', chunk => {
              body += chunk;
            });
            req.on('end', () => {
              res.writeHead(200, {'Content-Type': 'text/plain'});
              res.end(body);
            });
          }
        }, {useHTTP2});

        const stream = (async function* () {
          yield 'Test Stream Body';
        })();

        const response = await axiosInstance.post(`${server.origin}/redirect`, stream);

        expect(response.status).toBe(200);
        expect(response.data).toBe('Test Stream Body');
      });

      it('should change request method to GET for 303 redirects', async () => {
        const server = await startHTTPServer((req, res) => {
          if (req.path === '/redirect') {
            res.writeHead(303, {Location: '/final'});
            res.end();
            return;
          }

          if (req.path === '/final') {
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end(req.method);
          }
        }, {useHTTP2});

        const response = await axiosInstance.post(`${server.origin}/redirect`, 'Test Body');

        expect(response.status).toBe(200);
        expect(response.data).toBe('GET');
      });

      it('should preserve request method for 307 and 308 redirects', async () => {
        const server = await startHTTPServer((req, res) => {
          if (req.path === '/redirect') {
            res.writeHead(307, {Location: '/final'});
            res.end();
            return;
          }

          if (req.path === '/final') {
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end(req.method);
          }
        }, {useHTTP2});

        const response = await axiosInstance.post(`${server.origin}/redirect`, 'Test Body');

        expect(response.status).toBe(200);
        expect(response.data).toBe('POST');
      });

      it('should change request method to GET for 301 and 302 redirects if original method is not GET or HEAD', async () => {
        const server = await startHTTPServer((req, res) => {
          if (req.path === '/redirect') {
            res.writeHead(301, {Location: '/final'});
            res.end();
            return;
          }

          if (req.path === '/final') {
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end(req.method);
          }
        }, {useHTTP2});

        const response = await axiosInstance.post(`${server.origin}/redirect`, 'Test Body');

        expect(response.status).toBe(200);
        expect(response.data).toBe('GET');
      });

      it('should throw error if maxRedirects is exceeded', async () => {
        const server = await startHTTPServer((req, res) => {
          if (req.path === '/redirect') {
            res.writeHead(302, {Location: '/redirect'});
            res.end();
            return;
          }
        }, {useHTTP2});

        try {
          await axiosInstance.get(`${server.origin}/redirect`, {
            maxRedirects: 5
          });

          expect.fail('Expected to throw an error due to maxRedirects exceeded');
        } catch (error) {
          expect(error.message).toMatch(/Maximum number of redirects exceeded/);
          expect(error.response).toBeDefined();
          expect(error.response.status).toBe(302);
          expect(error.response.headers.get('Location')).toBe('/redirect');
          expect(error.response.config.meta.redirectsCount).toBe(5);
        }
      });

      it('should sanitize headers when sanitize function is called in beforeRedirect hook', async () => {
        const server = await startHTTPServer((req, res) => {
          if (req.path === '/redirect') {
            res.writeHead(302, {Location: '/final'});
            res.end();
            return;
          }

          if (req.path === '/final') {
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end(req.headers['authorization'] || '');
          }
        }, {useHTTP2});

        const beforeRedirect = vi.fn(({sanitize}) => {
          sanitize();
        });

        const response = await axiosInstance.get(`${server.origin}/redirect`, {
          headers: {
            Authorization: 'Bearer secret-token'
          },
          beforeRedirect
        });

        expect(response.status).toBe(200);
        expect(response.data).toBe('');
        expect(beforeRedirect).toHaveBeenCalled();
      });

      it('should sanitize headers if redirected to different origin', async () => {
        const server1 = await startHTTPServer((req, res) => {
          if (req.path === '/redirect') {
            console.log('Redirecting to server2...');
            res.writeHead(302, {Location: server2.origin + '/final'});
            res.end();
          }
        }, {
          port: 0,
          useHTTP2
        });

        const server2 = await startHTTPServer((req, res) => {
          if (req.path === '/final') {
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end(req.headers['authorization'] || '');
          }
        }, {
          port: 0,
          useHTTP2
        });

        const response = await axiosInstance.get(`${server1.origin}/redirect`, {
          headers: {
            Authorization: 'Bearer secret-token'
          },
          beforeRedirect({url, redirectTo}) {
            console.log(`${url} => ${redirectTo}`);
          }
        });

        expect(response.status).toBe(200);
        expect(response.data).toBe('');
      });
      /*    it('should be able to make a redirect with stream payload within flushTimeout', async () => {
            const server = await startHTTPServer((req, res) => {
              if (req.path === '/redirect') {
                res.writeHead(307, {Location: '/final'});
                res.end();
                return;
              }

              if (req.path === '/final') {
                let body = '';
                req.on('data', chunk => {
                  body += chunk;
                });
                req.on('end', () => {
                  res.writeHead(200, {'Content-Type': 'text/plain'});
                  res.end(body);
                });
              }
            });

            const stream = (async function* () {
              yield 'Test Stream Body';
            })();

            const response = await axiosInstance.post(`http://localhost:${server.address().port}/redirect`, stream, {
              flushTimeout: 1000
            });

            expect(response.status).toBe(200);
            expect(response.data).toBe('Test Stream Body');
          });*/

      it('should be able to reread stream payload within flushTimeout for multiple redirects', async () => {
        const server = await startHTTPServer(async (req, res) => {
          if (req.path === '/redirect1') {
            res.writeHead(307, {Location: '/redirect2'});
            res.end(await getStreamAsBuffer(req));
            return;
          }

          if (req.path === '/redirect2') {
            res.writeHead(307, {Location: '/final'});
            res.end(await getStreamAsBuffer(req));
            return;
          }

          if (req.path === '/final') {
            let body = '';
            req.on('data', chunk => {
              body += chunk;
            });
            req.on('end', () => {
              res.writeHead(200, {'Content-Type': 'text/plain'});
              res.end(body);
            });
          }
        }, {useHTTP2});

        const stream = (async function* () {
          yield 'Test Stream Body';
        })();

        const beforeRedirect = vi.fn();

        const response = await axiosInstance.post(`${server.origin}/redirect1`, stream, {
          flushTimeout: 1000,
          beforeRedirect
        });

        const calls = beforeRedirect.mock.calls;

        expect(calls[0][0].response.data).toBe('Test Stream Body');
        expect(calls[1][0].response.data).toBe('Test Stream Body');

        expect(response.status).toBe(200);
        expect(response.data).toBe('Test Stream Body');
      });

      it('should throw error if stream payload is reading after the flushTimeout during redirects', async () => {
        const flushTimeout = 1000;

        const server = await startHTTPServer(async (req, res) => {
          if (req.path === '/redirect') {
            const body = await getStreamAsBuffer(req);
            await setTimeoutAsync(flushTimeout + 100);
            res.writeHead(307, {Location: '/final'});
            res.end(body);
            return;
          }

          if (req.path === '/final') {
            let body = '';
            req.on('data', chunk => {
              body += chunk;
            });
            req.on('end', () => {
              res.writeHead(200, {'Content-Type': 'text/plain'});
              res.end(body);
            });
          }
        }, {useHTTP2});

        const stream = (async function* () {
          yield 'Test ';
          await setTimeoutAsync(200);
          yield 'Stream ';
          await setTimeoutAsync(200);
          yield 'Body';
        })();

        try {
          await axiosInstance.post(`${server.origin}/redirect`, stream, {
            buffering: {
              flushTimeout
            }
          });

          expect.fail('Expected to throw an error due to stream payload reading after flushTimeout');
        } catch (error) {
          expect(error.code).toBe('ERR_STREAM_FLUSHED');
          expect(error.message).toMatch(/flushed/);
        }
      });

      it('should pause payload stream consumption when reached maxBufferSize during redirects and resume after stream flush', async () => {
        const maxBytes = 10;
        const flushTimeout = 1000;

        const server = await startHTTPServer(async (req, res) => {
          if (req.path === '/redirect') {
            setTimeout(() => {
              res.writeHead(307, {Location: '/final'});
              res.end('Redirect');
            }, 500);

            req.on('aborted', () => {
            });

            req.resume();

            return;
          }

          if (req.path === '/final') {
            res.writeHead(200, {'Content-Type': 'text/plain'});

            res.end(await getStreamAsBuffer(req));
          }
        }, {useHTTP2});

        const dummyDataBuffer = Buffer.from('Dummy request payload');

        const stream = (async function* () {
          try {
            for (let i = 0; i < 5; i++) {
              await setTimeoutAsync(100);
              console.log(`Yielding chunk ${i + 1}`);
              yield dummyDataBuffer;
            }
          } finally {
            console.log(`Stream generator finally block executed`);
          }
        })();

        let bytesRead = 0;

        const proxy = (async function* () {
          for await (const chunk of stream) {
            bytesRead += chunk.byteLength;
            yield chunk;
            console.log('Proxy chunk', bytesRead);
          }
        })();

        let bytesReadBeforeFlush = 0;

        setTimeout(() => {
          bytesReadBeforeFlush = bytesRead;
        }, flushTimeout - 500);

        const response = await axiosInstance.post(`${server.origin}/redirect`, proxy, {
          buffering: {
            maxBytes,
            flushTimeout
          }
        });

        expect(response.status).toBe(200);
        expect(response.data).toBe('Dummy request payload'.repeat(5));
        expect(bytesReadBeforeFlush).toBeLessThanOrEqual(dummyDataBuffer.byteLength);
        expect(bytesRead).toBe(dummyDataBuffer.byteLength * 5);
      });
    });
  });
});
