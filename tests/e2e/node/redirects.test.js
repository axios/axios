import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {getStreamAsBuffer} from 'get-stream';
import {enableTLS, startHTTPServer, stopAllTrackedHTTPServers, stopHTTPServer} from "../../setup/server.js";
import axios from '../../../index.js';
import {setTimeoutAsync} from "../../setup/helpers.js";


describe('redirects', () => {
  afterEach(async () => {
    await stopAllTrackedHTTPServers();
    enableTLS();
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
      const useHTTPS = useHTTP2;
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
        }, {useHTTP2, useHTTPS});

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
        }, {useHTTP2, useHTTPS});


        try {
          await axiosInstance.get(`${server.origin}/redirect`, {
            maxRedirects: 0
          });

          expect.fail('Expected to throw an error due to maxRedirects set to 0');
        } catch (error) {
          expect(error.message).toMatch(/Too many redirects/);
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
        }, {useHTTP2, useHTTPS});

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
        }, {useHTTP2, useHTTPS});

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
        }, {useHTTP2, useHTTPS});

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
        }, {useHTTP2, useHTTPS});

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
        }, {useHTTP2, useHTTPS});

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
        }, {useHTTP2, useHTTPS});

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
        }, {useHTTP2, useHTTPS});

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
        }, {useHTTP2, useHTTPS});

        try {
          await axiosInstance.get(`${server.origin}/redirect`, {
            maxRedirects: 5
          });

          expect.fail('Expected to throw an error due to maxRedirects exceeded');
        } catch (error) {
          expect(error.message).toMatch(/Too many redirects/);
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
        }, {useHTTP2, useHTTPS});

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
            res.writeHead(302, {Location: server2.origin + '/final'});
            res.end();
          }
        }, {
          port: 0,
          useHTTP2,
          useHTTPS
        });

        const server2 = await startHTTPServer((req, res) => {
          if (req.path === '/final') {
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end(req.headers['authorization'] || '');
          }
        }, {
          port: 0,
          useHTTP2,
          useHTTPS
        });

        const response = await axiosInstance.get(`${server1.origin}/redirect`, {
          headers: {
            Authorization: 'Bearer secret-token'
          }
        });

        expect(response.status).toBe(200);
        expect(response.data).toBe('');
      });

      it('should sanitize HTTP auth credentials in url if redirected to different origin', async () => {
        const server1 = await startHTTPServer((req, res) => {
          if (req.path === '/redirect') {
            res.writeHead(302, {Location: server2.origin + '/final'});
            res.end(JSON.stringify(req.headers));
          }
        }, {
          port: 0,
          useHTTP2,
          useHTTPS
        });

        const server2 = await startHTTPServer((req, res) => {
          if (req.path === '/final') {
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end(JSON.stringify(req.headers));
          }
        }, {
          port: 0,
          useHTTP2,
          useHTTPS
        });

        const username = 'Digital';
        const password = 'Brain';

        const beforeRedirect = vi.fn();

        const url = new URL(`${server1.origin}/redirect`);
        url.username = username;
        url.password = password;

        const response = await axiosInstance.get(url, {
          beforeRedirect
        });

        expect(beforeRedirect).toHaveBeenCalledWith(expect.objectContaining({
          response: expect.objectContaining({
            data: expect.objectContaining({
              authorization: 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64')
            })
          }),
          status: 302
        }));

        expect(response.status).toBe(200);
        expect(response.data.authorization).toBeUndefined();
      });

      it('should sanitize HTTP auth credentials in config if redirected to different origin', async () => {
        const server1 = await startHTTPServer((req, res) => {
          if (req.path === '/redirect') {
            res.writeHead(302, {Location: server2.origin + '/final'});
            res.end(JSON.stringify(req.headers));
          }
        }, {
          port: 0,
          useHTTP2,
          useHTTPS
        });

        const server2 = await startHTTPServer((req, res) => {
          if (req.path === '/final') {
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end(JSON.stringify(req.headers));
          }
        }, {
          port: 0,
          useHTTP2,
          useHTTPS
        });

        const username = 'Digital';
        const password = 'Brain';

        const beforeRedirect = vi.fn();

        const response = await axiosInstance.get(`${server1.origin}/redirect`, {
          auth: {
            username,
            password
          },
          beforeRedirect
        });

        expect(beforeRedirect).toHaveBeenCalledWith(expect.objectContaining({
          response: expect.objectContaining({
            data: expect.objectContaining({
              authorization: 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64')
            })
          }),
          status: 302
        }));

        expect(response.status).toBe(200);
        expect(response.data.authorization).toBeUndefined();
      });

      it('should be able to make a redirect with stream payload within flushTimeout', async () => {
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
        }, {
          useHTTP2,
          useHTTPS
        });

        const stream = (async function* () {
          yield 'Test Stream Body';
          yield 'Test Stream Body';
          yield 'Test Stream Body';
        })();

        const response = await axiosInstance.post(`${server.origin}/redirect`, stream, {
          flushTimeout: 1000
        });

        expect(response.status).toBe(200);
        expect(response.data).toBe('Test Stream Body'.repeat(3));
      });

      it('should be able to reread stream payload within timeout for multiple redirects', async () => {
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
        }, {useHTTP2, useHTTPS});

        const stream = (async function* () {
          yield 'Test Stream Body';
        })();

        const beforeRedirect = vi.fn();

        const response = await axiosInstance.post(`${server.origin}/redirect1`, stream, {
          timeout: 1000,
          beforeRedirect
        });

        const calls = beforeRedirect.mock.calls;

        expect(calls[0][0].response.data).toBe('Test Stream Body');
        expect(calls[1][0].response.data).toBe('Test Stream Body');

        expect(response.status).toBe(200);
        expect(response.data).toBe('Test Stream Body');
      });

      it('should throw error if stream payload is reading after the flush timeout during redirects', async () => {
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
        }, {useHTTP2, useHTTPS});

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
              timeout: flushTimeout,
              threshold: 0
            }
          });

          expect.fail('Expected to throw an error due to stream payload reading after flush timeout');
        } catch (error) {
          expect(error.code).toBe('ERR_STREAM_FLUSHED');
          expect(error.message).toMatch(/flushed/);
        }
      });

      it('should pause payload stream consumption when reached maxBufferSize during redirects and resume after stream flush', async () => {
        const limit = 10;
        const flushTimeout = 1000;

        const server = await startHTTPServer(async (req, res) => {
          if (req.path === '/redirect') {
            req.on('error', () => {
            });

            req.on('aborted', () => {
            });

            setTimeout(() => {
              res.writeHead(307, {Location: '/final'});
              res.end('Redirect');
            }, 500);

            req.resume();

            return;
          }

          if (req.path === '/final') {
            res.writeHead(200, {'Content-Type': 'text/plain'});

            res.end(await getStreamAsBuffer(req));
          }
        }, {useHTTP2, useHTTPS});

        const dummyDataBuffer = Buffer.from('Dummy request payload');

        const stream = (async function* () {
          for (let i = 0; i < 5; i++) {
            await setTimeoutAsync(100);
            yield dummyDataBuffer;
          }
        })();

        let bytesRead = 0;

        const proxy = (async function* () {
          for await (const chunk of stream) {
            bytesRead += chunk.byteLength;
            yield chunk;
          }
        })();

        let bytesReadBeforeFlush = 0;

        setTimeout(() => {
          bytesReadBeforeFlush = bytesRead;
        }, flushTimeout - 500);

        const response = await axiosInstance.post(`${server.origin}/redirect`, proxy, {
          buffering: {
            limit,
            timeout: flushTimeout,
            threshold: 0
          }
        });

        expect(response.status).toBe(200);
        expect(response.data).toBe('Dummy request payload'.repeat(5));
        expect(bytesReadBeforeFlush).toBeLessThanOrEqual(dummyDataBuffer.byteLength);
        expect(bytesRead).toBe(dummyDataBuffer.byteLength * 5);
      });

      it.skipIf(useHTTP2)('should allow switching from http to https during redirects', async () => {
        const server1 = await startHTTPServer((req, res) => {
          if (req.path === '/redirect') {
            res.writeHead(302, {Location: server2.origin + '/final'});
            res.end();
          } else {
            res.end('OK');
          }
        }, {
          port: 0,
          useHTTPS: false
        });

        const server2 = await startHTTPServer((req, res) => {
          if (req.path === '/final') {
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end('Final Destination');
          }
        }, {
          port: 0,
          useHTTPS: true
        });

        const response = await axiosInstance.get(`${server1.origin}/redirect`, {
          maxRedirects: 1
        });

        expect(response.status).toBe(200);
        expect(response.data).toBe('Final Destination');
      });

      it.skipIf(useHTTP2)('should block switching from https to http during redirects', async () => {
        const server1 = await startHTTPServer((req, res) => {
          if (req.path === '/redirect') {
            res.writeHead(302, {Location: server2.origin + '/final'});
            res.end();
          } else {
            res.end('OK');
          }
        }, {
          port: 0,
          useHTTPS: true
        });

        const server2 = await startHTTPServer((req, res) => {
          if (req.path === '/final') {
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end('Final Destination');
          }
        }, {
          port: 0,
          useHTTPS: false
        });

        try {
          await axiosInstance.get(`${server1.origin}/redirect`, {
            maxRedirects: 1
          });

          expect.fail('Expected to throw an error due to blocked protocol downgrade from https to http');
        } catch (error) {
          expect(error.message).toMatch(/Protocol downgrade is not allowed/);
          expect(error.response).toBeDefined();
          expect(error.response.status).toBe(302);
          expect(error.response.headers.get('Location')).toBe(server2.origin + '/final');
        }
      });

      it.skipIf(useHTTP2)('should keep cookies and other headers during redirects to the same host when switching to https', async () => {
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
        }, {
          port: 0,
          useHTTPS: false
        });

        const response = await axiosInstance.get(`${server.origin}/redirect`, {
          headers: {
            Authorization: 'Bearer secret-token'
          },
          maxRedirects: 1
        });

        expect(response.status).toBe(200);
        expect(response.data).toBe('Bearer secret-token');
      });

      it('should reject with the original response if it does not contain a location header', async () => {
        const server = await startHTTPServer((req, res) => {
          if (req.path === '/redirect') {
            res.writeHead(302);
            res.end('First response');
            return;
          }

          if (req.path === '/final') {
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end('Final Destination');
          }
        }, {useHTTP2, useHTTPS});

        try {
          await axiosInstance.get(`${server.origin}/redirect`);
          expect.fail('Expected to throw an error due to missing Location header in redirect response');
        } catch(err) {
          expect(err.response?.status).toBe(302);
          expect(err.response?.data).toBe('First response');
        }
      });

      it('should respect validateStatus when following redirects', async () => {
        const server = await startHTTPServer((req, res) => {
          if (req.path === '/redirect') {
            res.writeHead(302, {Location: '/final'});
            res.end('Redirecting');
            return;
          }

          if (req.path === '/final') {
            res.writeHead(201, {'Content-Type': 'text/plain'});
            res.end('Final Destination');
          }
        }, {useHTTP2, useHTTPS});

        try {
          await axiosInstance.get(`${server.origin}/redirect`, {
            validateStatus(status) {
              return status === 200;
            }
          });

          expect.fail('Expected to throw an error due to validateStatus rejecting the final response status');
        } catch (error) {
          expect(error.code).toBe('ERR_BAD_RESPONSE');
          expect(error.response).toBeDefined();
          expect(error.response.status).toBe(201);
          expect(error.response.data).toBe('Final Destination');
        }
      });


      describe('followStatusCodes', () => {
        Object.entries({
          'Single number': 310,
          'Single string': '310',
          Array: [311, 310],
          'Array of strings': ['311', '310'],
          'String list': '310, 311',
          'Hash object': {309: true, 310: true, 311: false}
        }).forEach(([description, followStatusCodes]) => {
          it(`should support ${description} as the option value`, async () => {
            const server = await startHTTPServer((req, res) => {
              if (req.path === '/redirect') {
                res.writeHead(310, {Location: '/final'});
                res.end('Redirecting');
                return;
              }

              if (req.path === '/final') {
                res.writeHead(200, {'Content-Type': 'text/plain'});
                res.end('Final Destination');
              }
            }, {useHTTP2, useHTTPS});

            const response = await axiosInstance.get(`${server.origin}/redirect`, {
              followStatusCodes
            });

            expect(response.status).toBe(200);
            expect(response.data).toBe('Final Destination');
          });
        });

        it(`should allow customizing redirect status codes with followStatusCodes option`, async () => {
          const server = await startHTTPServer((req, res) => {
            if (req.path === '/redirect') {
              res.writeHead(310, {Location: '/final'});
              res.end('Redirecting');
              return;
            }

            if (req.path === '/final') {
              res.writeHead(200, {'Content-Type': 'text/plain'});
              res.end('Final Destination');
            }
          }, {useHTTP2, useHTTPS});

          const response = await axiosInstance.get(`${server.origin}/redirect`, {
            followStatusCodes: [310]
          });

          expect(response.status).toBe(200);
          expect(response.data).toBe('Final Destination');
        });


        it('should not follow redirects that not listed in followStatusCodes option', async () => {
          const server = await startHTTPServer((req, res) => {
            if (req.path === '/redirect') {
              res.writeHead(310, {Location: '/final'});
              res.end('Redirecting');
              return;
            }

            if (req.path === '/final') {
              res.writeHead(200, {'Content-Type': 'text/plain'});
              res.end('Final Destination');
            }
          }, {useHTTP2, useHTTPS});

          try {
            await axiosInstance.get(`${server.origin}/redirect`, {
              followStatusCodes: [301]
            });

            expect.fail('Expected to throw an error due to redirect status code not being in followStatusCodes option');
          } catch (error) {
            expect(error.response).toBeDefined();
            expect(error.response.status).toBe(310);
            expect(error.response.data).toBe('Redirecting');
          }
        });
      });


      it('should not follow redirect if beforeRedirect hook returns false', async () => {
        const server = await startHTTPServer((req, res) => {
          if (req.path === '/redirect') {
            res.writeHead(302, {Location: '/final'});
            res.end('Redirecting');
            return;
          }

          if (req.path === '/final') {
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end('Final Destination');
          }
        }, {useHTTP2, useHTTPS});

        const beforeRedirect = vi.fn(() => false);

        const response = await axiosInstance.get(`${server.origin}/redirect`, {
          beforeRedirect,
          validateStatus: (status) => status >= 200 && status < 400
        });

        expect(response.status).toBe(302);
        expect(response.data).toBe('Redirecting');
        expect(beforeRedirect).toHaveBeenCalled();
      });

      it('should allow modifying the redirect request config in beforeRedirect hook', async () => {
        const server = await startHTTPServer((req, res) => {
          if (req.path === '/redirect') {
            res.writeHead(302, {Location: '/final'});
            res.end('Redirecting');
            return;
          }

          if (req.path === '/final') {
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end(req.headers['x-custom-header'] || '');
          }
        }, {useHTTP2, useHTTPS});

        const beforeRedirect = vi.fn(({config}) => {
          config.headers.set('X-Custom-Header', 'CustomValue');
          config.customValue = 'foo';
        });

        const response = await axiosInstance.get(`${server.origin}/redirect`, {
          beforeRedirect,
          validateStatus: (status) => status >= 200 && status < 400
        });

        expect(response.status).toBe(200);
        expect(response.config.customValue).toBe('foo');
        expect(response.data).toBe('CustomValue');
        expect(beforeRedirect).toHaveBeenCalled();
      });

      it('should allow modifying the target URL in beforeRedirect hook via redirectTo URL object', async () => {
        const server = await startHTTPServer((req, res) => {
          if (req.path === '/redirect') {
            res.writeHead(302, {Location: '/final'});
            res.end('Redirecting');
            return;
          }

          if (req.path === '/changed') {
            res.writeHead(200, {'Content-Type': 'text/plain'});
            return res.end(req.url);
          }

          res.end(`Not found [${req.path}]`);
        }, {useHTTP2, useHTTPS});

        const beforeRedirect = vi.fn(({redirectTo}) => {
          redirectTo.search = '?modified';
          redirectTo.pathname = 'changed';
        });

        const response = await axiosInstance.get(`${server.origin}/redirect`, {
          beforeRedirect,
          validateStatus: (status) => status >= 200 && status < 400
        });

        expect(beforeRedirect).toHaveBeenCalled();
        expect(response.status).toBe(200);
        expect(response.data).toBe('/changed?modified');
      });

      it.skipIf(useHTTP2)('should not sanitize headers if shouldSanitize is called with false in beforeRedirect hook even for cross-origin redirects', async () => {
        const server1 = await startHTTPServer((req, res) => {
          if (req.path === '/redirect') {
            res.writeHead(302, {Location: server2.origin + '/final'});
            res.end();
          } else {
            res.end('OK');
          }
        }, {
          port: 0,
          useHTTPS: false
        });

        const server2 = await startHTTPServer((req, res) => {
          if (req.path === '/final') {
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end(req.headers['authorization'] || '');
          }
        }, {
          port: 0,
          useHTTPS: true
        });

        const beforeRedirect = vi.fn(({sanitize}) => {
          sanitize(false);
        });

        const response = await axiosInstance.get(`${server1.origin}/redirect`, {
          headers: {
            Authorization: 'Bearer secret-token'
          },
          beforeRedirect
        });

        expect(response.status).toBe(200);
        expect(response.data).toBe('Bearer secret-token');
        expect(beforeRedirect).toHaveBeenCalled();
      });

      it.skipIf(useHTTP2)('should not sanitize headers for redirects to the same domain or subdomain', async () => {
        const port = 8080;

        await startHTTPServer((req, res) => {
          if (req.path === '/redirect') {
            res.writeHead(302, {Location: `http://final.127.0.0.1.nip.io:${port}/final`});
            res.end();
            return;
          }

          if (req.path === '/final') {
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end(req.headers['authorization'] || '');
          }
        }, {useHTTP2, useHTTPS, port});

        const response = await axiosInstance.get(`http://127.0.0.1.nip.io:${port}/redirect`, {
          headers: {
            Authorization: 'Bearer secret-token'
          }
        });

        expect(response.status).toBe(200);
        expect(response.data).toBe('Bearer secret-token');
      });

      it('should return redirectsCount in response.config.meta property', async () => {
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
        }, {useHTTP2, useHTTPS});

        const response = await axiosInstance.get(server.origin + '/redirect');

        expect(response.status).toBe(200);
        expect(response.data).toBe('Final Destination');
        expect(response.config.meta.redirectsCount).toBe(1);
      });



    });
  });
});
