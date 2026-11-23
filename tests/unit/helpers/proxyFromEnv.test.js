import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import fs from 'fs';
import http from 'http';
import https from 'https';
import net from 'net';
import axios from '../../../index.js';
import { getEnv, getProxyForUrl } from '../../../lib/helpers/proxyFromEnv.js';
import shouldBypassProxy from '../../../lib/helpers/shouldBypassProxy.js';

const ENV_KEYS = [
  'http_proxy',
  'HTTP_PROXY',
  'https_proxy',
  'HTTPS_PROXY',
  'all_proxy',
  'ALL_PROXY',
  'no_proxy',
  'NO_PROXY',
  'npm_config_proxy',
  'NPM_CONFIG_PROXY',
  'npm_config_http_proxy',
  'NPM_CONFIG_HTTP_PROXY',
];

const clearInherited = () => {
  for (const key of ENV_KEYS) {
    delete Object.prototype[key];
  }
};

describe('helpers::proxyFromEnv', () => {
  let savedEnv;

  beforeEach(() => {
    savedEnv = {};

    for (const key of ENV_KEYS) {
      if (Object.prototype.hasOwnProperty.call(process.env, key)) {
        savedEnv[key] = process.env[key];
      }
      delete process.env[key];
    }

    clearInherited();
  });

  afterEach(() => {
    clearInherited();

    for (const key of ENV_KEYS) {
      delete process.env[key];
      if (Object.prototype.hasOwnProperty.call(savedEnv, key)) {
        process.env[key] = savedEnv[key];
      }
    }
  });

  describe('getProxyForUrl', () => {
    it('should return an empty string when no proxy variable is set', () => {
      expect(getProxyForUrl('http://example.com/')).toBe('');
    });

    it('should use the proxy variable for the request scheme', () => {
      process.env.HTTP_PROXY = 'http://proxy.local:8080';
      process.env.HTTPS_PROXY = 'http://secure-proxy.local:8443';

      expect(getProxyForUrl('http://example.com/')).toBe('http://proxy.local:8080');
      expect(getProxyForUrl('https://example.com/')).toBe('http://secure-proxy.local:8443');
    });

    it('should prefer the lower-case variable over the upper-case one', () => {
      process.env.http_proxy = 'http://lower.local:1';
      process.env.HTTP_PROXY = 'http://upper.local:2';

      expect(getProxyForUrl('http://example.com/')).toBe('http://lower.local:1');
    });

    it('should fall back to all_proxy', () => {
      process.env.ALL_PROXY = 'http://all.local:1';
      expect(getProxyForUrl('http://example.com/')).toBe('http://all.local:1');

      process.env.http_proxy = 'http://scheme.local:2';
      expect(getProxyForUrl('http://example.com/')).toBe('http://scheme.local:2');
    });

    it('should not read npm_config proxy variables', () => {
      process.env.npm_config_http_proxy = 'http://npm-scheme.local:1';
      process.env.npm_config_proxy = 'http://npm.local:2';

      expect(getProxyForUrl('http://example.com/')).toBe('');
    });

    it('should default a proxy without a scheme to the request scheme', () => {
      process.env.HTTPS_PROXY = 'proxy.local:8443';

      expect(getProxyForUrl('https://example.com/')).toBe('https://proxy.local:8443');
    });

    it('should return an empty string for URLs without a host or scheme', () => {
      process.env.HTTP_PROXY = 'http://proxy.local:8080';

      expect(getProxyForUrl('/relative/path')).toBe('');
      expect(getProxyForUrl('')).toBe('');
      expect(getProxyForUrl('not a url')).toBe('');
      expect(getProxyForUrl(null)).toBe('');
    });

    it('should accept URL objects', () => {
      process.env.HTTP_PROXY = 'http://proxy.local:8080';
      process.env.NO_PROXY = 'internal.local';

      expect(getProxyForUrl(new URL('http://example.com/'))).toBe('http://proxy.local:8080');
      expect(getProxyForUrl(new URL('http://internal.local/'))).toBe('');
    });

    it('should not proxy hosts matched by no_proxy', () => {
      process.env.HTTP_PROXY = 'http://proxy.local:8080';
      process.env.NO_PROXY = 'internal.local,.corp.local,*.svc,example.com:8080';

      expect(getProxyForUrl('http://internal.local/')).toBe('');
      expect(getProxyForUrl('http://a.corp.local/')).toBe('');
      expect(getProxyForUrl('http://api.svc/')).toBe('');
      expect(getProxyForUrl('http://example.com:8080/')).toBe('');
      expect(getProxyForUrl('http://example.com/')).toBe('http://proxy.local:8080');
      expect(getProxyForUrl('http://other.local/')).toBe('http://proxy.local:8080');
    });

    it('should not proxy anything when no_proxy is a wildcard', () => {
      process.env.HTTP_PROXY = 'http://proxy.local:8080';
      process.env.no_proxy = '*';

      expect(getProxyForUrl('http://example.com/')).toBe('');
    });

    it('should match no_proxy entries case-insensitively', () => {
      process.env.HTTP_PROXY = 'http://proxy.local:8080';
      process.env.NO_PROXY = 'EXAMPLE.COM,.Corp.Local';

      expect(getProxyForUrl('http://example.com/')).toBe('');
      expect(getProxyForUrl('http://a.corp.local/')).toBe('');
      expect(getProxyForUrl('http://other.local/')).toBe('http://proxy.local:8080');
    });

    it('should keep the brackets around IPv6 hosts when matching no_proxy', () => {
      process.env.HTTP_PROXY = 'http://proxy.local:8080';
      process.env.NO_PROXY = '[::1]';

      expect(getProxyForUrl('http://[::1]:8080/')).toBe('');
      expect(getProxyForUrl('http://[::2]:8080/')).toBe('http://proxy.local:8080');
    });

    it('should ignore proxy variables inherited from Object.prototype', () => {
      Object.prototype.http_proxy = 'http://inherited.local:1';
      Object.prototype.HTTPS_PROXY = 'http://inherited.local:2';
      Object.prototype.all_proxy = 'http://inherited.local:3';

      expect(getProxyForUrl('http://example.com/')).toBe('');
      expect(getProxyForUrl('https://example.com/')).toBe('');
    });

    it('should not let an inherited lower-case variable override the real one', () => {
      process.env.HTTP_PROXY = 'http://proxy.local:8080';
      Object.prototype.http_proxy = 'http://inherited.local:1';

      expect(getProxyForUrl('http://example.com/')).toBe('http://proxy.local:8080');
    });

    it('should ignore an inherited no_proxy value', () => {
      process.env.HTTP_PROXY = 'http://proxy.local:8080';
      Object.prototype.no_proxy = '*';
      Object.prototype.NO_PROXY = '*';

      expect(getProxyForUrl('http://example.com/')).toBe('http://proxy.local:8080');
    });

    it('should read a replaced process.env that inherits its values', () => {
      const originalEnv = process.env;

      try {
        process.env = Object.create({ HTTP_PROXY: 'http://proxy.local:8080' });

        expect(getProxyForUrl('http://example.com/')).toBe('http://proxy.local:8080');

        Object.prototype.http_proxy = 'http://inherited.local:1';
        Object.prototype.NO_PROXY = '*';

        expect(getProxyForUrl('http://example.com/')).toBe('http://proxy.local:8080');
      } finally {
        process.env = originalEnv;
      }
    });
  });

  describe('getEnv', () => {
    it('should prefer the lower-case name and default to an empty string', () => {
      expect(getEnv('no_proxy')).toBe('');

      process.env.NO_PROXY = 'upper.local';
      expect(getEnv('no_proxy')).toBe('upper.local');

      process.env.no_proxy = 'lower.local';
      expect(getEnv('no_proxy')).toBe('lower.local');
    });
  });

  describe('shouldBypassProxy', () => {
    it('should ignore an inherited no_proxy value', () => {
      Object.prototype.no_proxy = '*';
      Object.prototype.NO_PROXY = 'example.com';

      expect(shouldBypassProxy('http://example.com/')).toBe(false);
    });

    it('should still honour a real no_proxy value', () => {
      process.env.NO_PROXY = 'example.com';

      expect(shouldBypassProxy('http://example.com/')).toBe(true);
    });
  });

  describe('http adapter', () => {
    const tlsOptions = {
      key: fs.readFileSync(new URL('../adapters/key.pem', import.meta.url)),
      cert: fs.readFileSync(new URL('../adapters/cert.pem', import.meta.url)),
    };
    let target;
    let secureTarget;
    let proxy;
    let insecureAgent;
    let proxyRequests;
    let redirectTo;
    let tunnels;

    // The HTTPS target listens on every interface and is reached as localhost,
    // so its certificate name matches whichever address localhost resolves to.
    const listen = (server, host) =>
      new Promise((resolve) => {
        server.listen(0, host, resolve);
      });

    const close = (server) =>
      new Promise((resolve) => {
        if (typeof server.closeAllConnections === 'function') {
          server.closeAllConnections();
        }
        server.close(() => resolve());
      });

    const origin = (server) => 'http://127.0.0.1:' + server.address().port;
    const secureOrigin = (server) => 'https://localhost:' + server.address().port;

    beforeEach(async () => {
      proxyRequests = [];
      redirectTo = null;
      tunnels = new Set();
      insecureAgent = new https.Agent({ rejectUnauthorized: false, keepAlive: false });

      target = http.createServer((req, res) => {
        res.end('target');
      });
      secureTarget = https.createServer(tlsOptions, (req, res) => {
        res.end('secure target');
      });
      proxy = http.createServer((req, res) => {
        proxyRequests.push(req.url);

        if (redirectTo && /\/redirect$/.test(req.url)) {
          res.writeHead(302, { Location: redirectTo });
          res.end();
          return;
        }

        res.end('proxy');
      });
      proxy.on('connect', (req, clientSocket, head) => {
        proxyRequests.push('CONNECT ' + req.url);

        const separator = req.url.lastIndexOf(':');
        const upstream = net.connect(
          Number(req.url.slice(separator + 1)),
          req.url.slice(0, separator),
          () => {
            clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
            upstream.write(head);
            upstream.pipe(clientSocket);
            clientSocket.pipe(upstream);
          }
        );

        tunnels.add(upstream);
        tunnels.add(clientSocket);
        upstream.on('error', () => clientSocket.destroy());
        clientSocket.on('error', () => upstream.destroy());
      });

      await Promise.all([
        listen(target, '127.0.0.1'),
        listen(secureTarget),
        listen(proxy, '127.0.0.1'),
      ]);
    });

    afterEach(async () => {
      clearInherited();
      insecureAgent.destroy();

      for (const socket of tunnels) {
        socket.destroy();
      }

      await Promise.all([close(target), close(secureTarget), close(proxy)]);
    });

    it('should not route requests through a proxy inherited from Object.prototype', async () => {
      const targetUrl = origin(target) + '/';

      Object.prototype.http_proxy = origin(proxy);
      Object.prototype.HTTP_PROXY = origin(proxy);
      Object.prototype.all_proxy = origin(proxy);

      const response = await axios.get(targetUrl);

      expect(response.data).toBe('target');
      expect(proxyRequests).toEqual([]);
    });

    it('should still route requests through a proxy set in the environment', async () => {
      const targetUrl = origin(target) + '/';

      process.env.HTTP_PROXY = origin(proxy);

      const response = await axios.get(targetUrl);

      expect(response.data).toBe('proxy');
      expect(proxyRequests).toEqual([targetUrl]);
    });

    it('should not skip a configured proxy because of an inherited no_proxy value', async () => {
      const targetUrl = origin(target) + '/';

      process.env.HTTP_PROXY = origin(proxy);
      Object.prototype.no_proxy = '*';
      Object.prototype.NO_PROXY = '*';

      const response = await axios.get(targetUrl);

      expect(response.data).toBe('proxy');
      expect(proxyRequests).toEqual([targetUrl]);
    });

    it('should tunnel https requests through the https_proxy set in the environment', async () => {
      const secureUrl = secureOrigin(secureTarget) + '/';

      process.env.HTTPS_PROXY = origin(proxy);

      const response = await axios.get(secureUrl, { httpsAgent: insecureAgent });

      expect(response.data).toBe('secure target');
      expect(proxyRequests).toEqual(['CONNECT localhost:' + secureTarget.address().port]);
    });

    it('should not tunnel https requests through an https_proxy inherited from Object.prototype', async () => {
      const secureUrl = secureOrigin(secureTarget) + '/';

      Object.prototype.https_proxy = origin(proxy);
      Object.prototype.HTTPS_PROXY = origin(proxy);

      const response = await axios.get(secureUrl, { httpsAgent: insecureAgent });

      expect(response.data).toBe('secure target');
      expect(proxyRequests).toEqual([]);
    });

    it('should keep using the environment proxy after a redirect when no_proxy is inherited', async () => {
      const targetUrl = origin(target) + '/';
      const redirectUrl = origin(proxy) + '/redirect';

      redirectTo = targetUrl;
      process.env.HTTP_PROXY = origin(proxy);
      // Matches only the redirect target, so the first request is proxied
      // either way and only the redirected request depends on the lookup.
      Object.prototype.no_proxy = '127.0.0.1:' + target.address().port;

      const response = await axios.get(redirectUrl);

      expect(response.data).toBe('proxy');
      expect(proxyRequests).toEqual([redirectUrl, targetUrl]);
    });
  });
});
