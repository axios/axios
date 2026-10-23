import http from 'node:http';
import https from 'node:https';
import http2 from 'node:http2';
import net from 'node:net';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { gzipSync, deflateSync, brotliCompressSync } from 'node:zlib';

// This is the remote application in the e2e environment. Axios's transports,
// Fetch, XHR, streams, timers, and DNS are never replaced by test doubles.
export async function startServices({ assets, packageRoot } = {}) {
  const requests = [];
  const connections = new Set();
  const sessions = new Set();
  const servers = [];
  const cert = await readFile(new URL('./tls/cert.pem', import.meta.url));
  const key = await readFile(new URL('./tls/key.pem', import.meta.url));
  const info = {};
  const send = (res, data, status = 200, headers = {}) => {
    res.writeHead(status, { 'content-type': 'application/json', ...headers });
    res.end(JSON.stringify(data));
  };
  const listen = async (server) => {
    servers.push(server);
    server.on('connection', (socket) => {
      connections.add(socket);
      socket.once('close', () => connections.delete(socket));
    });
    await new Promise((ok, fail) => {
      server.once('error', fail);
      server.listen(0, '127.0.0.1', ok);
    });
    return server.address().port;
  };
  const serveFile = async (res, root, relative) => {
    const target = resolve(root, relative);
    if (!target.startsWith(resolve(root) + sep)) return send(res, {}, 403);
    try {
      const content = await readFile(target);
      const types = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css' };
      res.writeHead(200, { 'content-type': types[extname(target)] || 'application/octet-stream' });
      res.end(content);
    } catch {
      send(res, {}, 404);
    }
  };
  const handler = async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const record = {
      path: url.pathname,
      url: req.url,
      method: req.method,
      headers: req.headers,
      closed: false,
    };
    requests.push(record);
    res.once('close', () => {
      record.closed = true;
    });
    const origin = req.headers.origin;
    if (url.pathname !== '/no-cors' && origin) {
      res.setHeader('access-control-allow-origin', origin);
      res.setHeader('access-control-allow-credentials', 'true');
      res.setHeader(
        'access-control-allow-headers',
        req.headers['access-control-request-headers'] || '*'
      );
      res.setHeader('access-control-allow-methods', 'GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS');
      res.setHeader('access-control-expose-headers', 'x-request-id, content-length');
      res.setHeader('vary', 'Origin');
    }
    if (req.method === 'OPTIONS') return res.writeHead(204).end();
    if (url.pathname === '/records')
      return send(
        res,
        requests.filter((r) => r.path !== '/records')
      );
    if (url.pathname === '/health') return send(res, { ok: true });
    if (url.pathname === '/cookie') {
      return send(res, { ok: true }, 200, {
        'set-cookie': [
          'session=e2e; Path=/; SameSite=Lax',
          'XSRF-TOKEN=e2e-token; Path=/; SameSite=Lax',
        ],
      });
    }
    if (url.pathname === '/reset') return req.socket.destroy();
    if (url.pathname === '/protected' && req.headers.authorization !== 'Bearer refreshed')
      return send(res, { error: 'expired' }, 401);
    if (url.pathname === '/oversize') {
      res.writeHead(200, { 'content-type': 'text/plain', 'content-length': '1000' });
      res.write('first');
      return;
    }
    if (url.pathname === '/redirect') {
      const location = url.searchParams.get('to') || '/echo';
      return res.writeHead(Number(url.searchParams.get('status') || 302), { location }).end();
    }
    if (url.pathname === '/loop') return res.writeHead(302, { location: '/loop' }).end();
    if (url.pathname === '/slow') {
      const timer = setTimeout(() => send(res, { ok: true }), 1000);
      res.once('close', () => clearTimeout(timer));
      return;
    }
    if (url.pathname === '/stream' || url.pathname === '/pending') {
      const pending = url.pathname === '/pending';
      res.writeHead(200, {
        'content-type': 'text/plain',
        ...(pending ? {} : { 'content-length': '18' }),
      });
      res.write('first\n');
      if (pending) return;
      const timer = setTimeout(() => {
        res.write('second\n');
        res.end('last\n');
      }, 60);
      res.once('close', () => clearTimeout(timer));
      return;
    }
    if (url.pathname === '/binary') {
      const bytes = Buffer.from([0, 255, 1, 128, 13, 10]);
      return res
        .writeHead(200, {
          'content-type': 'application/octet-stream',
          'content-length': bytes.length,
        })
        .end(bytes);
    }
    if (url.pathname === '/compressed') {
      const encoding = url.searchParams.get('encoding') || 'gzip';
      const encode = { gzip: gzipSync, deflate: deflateSync, br: brotliCompressSync }[encoding];
      const bytes = encode(
        Buffer.from(JSON.stringify({ message: 'compressed response', padding: 'x'.repeat(4096) }))
      );
      return res
        .writeHead(200, {
          'content-type': 'application/json',
          'content-encoding': encoding,
          'content-length': bytes.length,
        })
        .end(bytes);
    }
    if (url.pathname === '/json') {
      return res
        .writeHead(200, { 'content-type': 'application/json' })
        .end(url.searchParams.has('invalid') ? '{invalid' : '\ufeff{"ok":true}');
    }
    if (url.pathname === '/status')
      return send(
        res,
        { error: 'service unavailable' },
        Number(url.searchParams.get('code') || 503)
      );
    if (url.pathname === '/app' && assets) return serveFile(res, assets, 'index.html');
    if (url.pathname.startsWith('/assets/') && assets)
      return serveFile(res, assets, url.pathname.slice(1));
    if (url.pathname === '/axios.umd.js' && packageRoot)
      return serveFile(res, packageRoot, 'dist/axios.js');
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = Buffer.concat(chunks);
    if (url.pathname === '/size') return send(res, { size: body.length });
    const type = req.headers['content-type'] || '';
    let form;
    if (type.startsWith('multipart/form-data')) {
      const parsed = await new Response(body, { headers: { 'content-type': type } }).formData();
      form = [];
      for (const [name, value] of parsed) {
        form.push([
          name,
          typeof value === 'string'
            ? value
            : {
                name: value.name,
                type: value.type,
                bytes: [...new Uint8Array(await value.arrayBuffer())],
              },
        ]);
      }
    }
    send(
      res,
      {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: body.toString(),
        bytes: [...body],
        form,
        remotePort: req.socket.remotePort,
        httpVersion: req.httpVersion,
      },
      200,
      { 'x-request-id': 'e2e-request' }
    );
  };
  const safeHandler = (req, res) => {
    handler(req, res).catch((error) => {
      if (!res.headersSent) send(res, { fixtureError: error.message }, 500);
      else res.destroy(error);
    });
  };
  try {
    info.origin = `http://127.0.0.1:${await listen(http.createServer(safeHandler))}`;
    info.other = `http://127.0.0.1:${await listen(http.createServer(safeHandler))}`;
    info.secure = `https://127.0.0.1:${await listen(https.createServer({ key, cert }, safeHandler))}`;
    const h2 = http2.createServer(safeHandler);
    h2.on('session', (session) => {
      sessions.add(session);
      session.once('close', () => sessions.delete(session));
    });
    info.http2 = `http://127.0.0.1:${await listen(h2)}`;
    const allowed = new Set([info.origin, info.other, info.secure].map((url) => new URL(url).port));
    const proxy = http.createServer((req, res) => {
      const target = new URL(req.url);
      if (target.hostname !== '127.0.0.1' || !allowed.has(target.port))
        return res.writeHead(403).end();
      requests.push({ path: 'proxy', target: req.url, headers: req.headers });
      const headers = { ...req.headers };
      delete headers['proxy-authorization'];
      const upstream = http.request(target, { method: req.method, headers }, (response) => {
        res.writeHead(response.statusCode, response.headers);
        response.pipe(res);
      });
      upstream.on('error', () => res.destroy());
      req.pipe(upstream);
    });
    proxy.on('connect', (req, client, head) => {
      const target = new URL(`http://${req.url}`);
      if (target.hostname !== '127.0.0.1' || !allowed.has(target.port)) return client.destroy();
      requests.push({ path: 'connect', target: req.url, headers: req.headers });
      const upstream = net.connect(Number(target.port), target.hostname, () => {
        client.write('HTTP/1.1 200 Connection Established\r\n\r\n');
        if (head.length) upstream.write(head);
        client.pipe(upstream).pipe(client);
      });
      connections.add(upstream);
      upstream.once('close', () => connections.delete(upstream));
      upstream.on('error', () => client.destroy());
      client.on('error', () => upstream.destroy());
      client.on('close', () => upstream.destroy());
    });
    info.proxy = `http://127.0.0.1:${await listen(proxy)}`;
    return {
      info,
      cert: cert.toString(),
      requests,
      async close() {
        for (const session of sessions) session.destroy();
        for (const socket of connections) socket.destroy();
        await Promise.all(servers.map((server) => new Promise((done) => server.close(done))));
      },
    };
  } catch (error) {
    for (const socket of connections) socket.destroy();
    for (const server of servers) server.close();
    throw error;
  }
}
