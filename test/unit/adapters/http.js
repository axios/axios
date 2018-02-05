const url = require('url')

const nock = require('nock')

const axios = require('../../../index')

const http = require('http')
const zlib = require('zlib')
const fs = require('fs')
let proxy

const testUri = 'http://localhost'
const testData = {
  firstName: 'Fred',
  lastName: 'Flintstone',
  emailAddr: 'fred@example.com'
}

describe('http adapter', () => {
  afterEach(() => {
    if (proxy) {
      proxy.close()
      proxy = null
    }

    if (process.env.http_proxy) {
      delete process.env.http_proxy
    }
  })

  it('does handle timeouts', async () => {
    nock(testUri)
      .get('/')
      .delayConnection(1000)
      .reply(200, '<html></html>')

    try {
      await axios.get(testUri, {
        timeout: 250
      })
      fail('request should fail')
    } catch (err) {
      expect(err.code).toBe('ECONNABORTED')
      expect(err.message).toBe('timeout of 250ms exceeded')
    }
  })

  it('does parse json', async () => {
    nock(testUri)
      .get('/')
      .reply(200, testData)

    const res = await axios.get(testUri)
    expect(res.data).toEqual(testData)
  })

  it('does follow redirects by default', async () => {
    const str = 'test response'

    nock(testUri)
      .get('/one')
      .reply(302, undefined, {
        Location: url.resolve(testUri, 'two')
      })
      .get('/two')
      .reply(200, str)

    const res = await axios.get(url.resolve(testUri, 'one'))
    expect(res.data).toBe(str)
    expect(res.request.path).toBe('/two')
  })

  it('does not follow redirects when disabled', async () => {
    nock(testUri)
      .get('/')
      .reply(302, undefined, {
        Location: url.resolve(testUri, 'two')
      })

    const res = await axios.get(testUri, {
      maxRedirects: 0,
      validateStatus: function () {
        return true
      }
    })
    expect(res.status).toBe(302)
    expect(res.headers['location']).toBe(url.resolve(testUri, 'two'))
  })

  it('does follow redirects and respects maxRedirects', async () => {
    const testStr = 'it reached the goal'

    nock(testUri)
      .get('/')
      .times(3)
      .reply(302, undefined, {
        Location: testUri
      })
      .get('/')
      .reply(200, testStr)

    const res = await axios.get(testUri, {
      maxRedirects: 3
    })
    expect(res.status).toBe(200)
    expect('location' in res.headers).toBe(false)
    expect(res.data).toBe(testStr)
  })

  it('does unzip gzipped data', async () => {
    const dataGzipped = await new Promise((resolve, reject) => {
      zlib.gzip(JSON.stringify(testData), function (err, zipped) {
        if (err) {
          reject(err)
        }
        resolve(zipped)
      })
    })

    nock(testUri)
      .get('/')
      .reply(200, dataGzipped, {
        'Content-Type': 'application/json;charset=utf-8',
        'Content-Encoding': 'gzip'
      })

    const res = await axios.get(testUri)
    expect(res.data).toEqual(testData)
  })

  it('does handle invalid gzipped data', async () => {
    nock(testUri)
      .get('/')
      .reply(200, 'invalid gzip data', {
        'Content-Type': 'application/json;charset=utf-8',
        'Content-Encoding': 'gzip'
      })

    try {
      await axios.get(testUri)
      fail('should fail due to invalid gzip data')
    } catch (err) {
      expect(err.message).toEqual('unexpected end of file')
    }
  })

  it('does work with utf-8', async () => {
    const utf8Str = 'ж🤡🚀äöüß¯\\_(ツ)_/¯'

    nock(testUri)
      .get('/')
      .reply(200, utf8Str, {
        'Content-Type': 'text/html; charset=UTF-8'
      })

    const res = await axios.get(testUri)
    expect(res.data).toEqual(utf8Str)
  })

  it('does handle basic http auth', async () => {
    const user = 'foo'
    const authUri = url.parse(testUri)
    authUri.auth = user

    nock(testUri)
      .get('/')
      .basicAuth({
        user
      })
      .reply(200, function () {
        const base64 = Buffer.from(`${user}:`, 'utf8').toString('base64')
        expect(this.req.headers.authorization).toBe('Basic ' + base64)
      })

    await axios.get(url.format(authUri))
  })

  it('does handle basic http auth with headers', async () => {
    const username = 'foo'
    const password = 'bar'

    const auth = {
      username,
      password
    }

    nock(testUri)
      .get('/')
      .basicAuth({
        user: username,
        pass: password
      })
      .reply(200, function () {
        const base64 = Buffer.from(`${username}:${password}`, 'utf8').toString('base64')
        expect(this.req.headers.authorization).toBe('Basic ' + base64)
      })

    await axios.get(url.format(testUri), {
      auth
    })
  })

  it('does throw when response body is to long', async () => {
    const longStr = Array(5000).join('a')

    nock(testUri)
      .get('/')
      .reply(200, longStr)

    try {
      await axios.get(url.format(testUri), {
        maxContentLength: 2000
      })
      fail('should fail since content length is bigger as maxContentLength')
    } catch (error) {
      expect(error.message).toBe('maxContentLength size of 2000 exceeded')
    }
  })

  it('does work with streams for request and response', async (done) => {
    const readStream = fs.createReadStream(__filename)

    nock(testUri)
      .post('/')
      .reply(200, (uri, requestBody) => {
        return requestBody
      })

    const result = await axios.post(testUri, readStream, {
      responseType: 'stream'
    })

    const responseStream = result.data
    let string = ''

    responseStream.on('data', function (chunk) {
      string += chunk.toString('utf8')
    })

    responseStream.on('end', function () {
      expect(string).toBe(fs.readFileSync(__filename, 'utf8'))
      done()
    })
  })

  it('does work with buffers for request and response', async (done) => {
    const buf = Buffer.alloc(1024)
    buf.fill('x')

    nock(testUri)
      .post('/')
      .reply(200, function (uri, requestBody) {
        expect(this.req.headers['content-length']).toBe(buf.length)
        return requestBody
      })

    const result = await axios.post(testUri, buf, {
      responseType: 'stream'
    })

    const responseStream = result.data
    let string = ''

    responseStream.on('data', function (chunk) {
      string += chunk.toString('utf8')
    })

    responseStream.on('end', function () {
      expect(string).toBe(buf.toString())
      done()
    })
  })

  it('does support proxies via proxy config', (done) => {
    nock(testUri)
      .get('/')
      .reply(200, '12345', {
        'Content-Type': 'text/html; charset=UTF-8'
      })

    proxy = http.createServer(function (request, response) {
      var parsed = url.parse(request.url)
      var opts = {
        host: parsed.hostname,
        port: parsed.port,
        path: parsed.path
      }

      response.setHeader('Content-Type', 'text/html; charset=UTF-8')

      http.get(opts, function (res) {
        var body = ''
        res.on('data', function (data) {
          body += data
        })
        res.on('end', function () {
          response.end(body + '6789')
        })
      })
    }).listen(4000, () => {
      axios.get(testUri, {
        proxy: {
          host: 'localhost',
          port: 4000
        }
      }).then(function (res) {
        expect(res.data).toBe(123456789, 'should pass through proxy')
        done()
      })
    })
  })

  it('does respect proxy:false when env variable is preset', async () => {
    process.env.http_proxy = 'http://does-not-exists.example.com:4242/'

    nock(testUri)
      .get('/')
      .reply(200, '12345', {
        'Content-Type': 'text/html; charset=UTF-8'
      })

    try {
      const result = await axios.get(testUri, {
        proxy: false
      })
      expect(result.data).toBe(12345, 'should not through proxy')
    } catch (err) {
      fail(err.message)
    }
  })

  it('does support proxies via environment variable', (done) => {
    nock(testUri)
      .get('/')
      .reply(200, '12345', {
        'Content-Type': 'text/html; charset=UTF-8'
      })

    proxy = http.createServer(function (request, response) {
      var parsed = url.parse(request.url)
      var opts = {
        host: parsed.hostname,
        port: parsed.port,
        path: parsed.path
      }

      response.setHeader('Content-Type', 'text/html; charset=UTF-8')

      http.get(opts, function (res) {
        var body = ''
        res.on('data', function (data) {
          body += data
        })
        res.on('end', function () {
          response.end(body + '6789')
        })
      })
    }).listen(4000, () => {
      process.env.http_proxy = 'http://localhost:4000/'
      axios.get(testUri)
      .then(function (res) {
        expect(res.data).toBe(123456789, 'should pass through proxy')
        done()
      })
    })
  })

  it('does support proxies with auth', (done) => {
    nock(testUri)
      .get('/')
      .reply(200, '12345', {
        'Content-Type': 'text/html; charset=UTF-8'
      })

    proxy = http.createServer(function (request, response) {
      var parsed = url.parse(request.url)
      var opts = {
        host: parsed.hostname,
        port: parsed.port,
        path: parsed.path
      }
      var proxyAuth = request.headers['proxy-authorization']

      http.get(opts, function (res) {
        var body = ''
        res.on('data', function (data) {
          body += data
        })
        res.on('end', function () {
          response.setHeader('Content-Type', 'text/html; charset=UTF-8')
          response.end(JSON.stringify({proxyAuth, body}))
        })
      })
    }).listen(4000, function () {
      axios.get(testUri, {
        proxy: {
          host: 'localhost',
          port: 4000,
          auth: {
            username: 'user',
            password: 'pass'
          }
        }
      }).then(function (res) {
        var base64 = Buffer.from('user:pass', 'utf8').toString('base64')
        expect(res.data.proxyAuth).toBe('Basic ' + base64, 'should authenticate to the proxy')
        done()
      })
    })
  })

  it('does support proxies with auth from env variables', (done) => {
    nock(testUri)
      .get('/')
      .reply(200, '12345', {
        'Content-Type': 'text/html; charset=UTF-8'
      })

    proxy = http.createServer(function (request, response) {
      var parsed = url.parse(request.url)
      var opts = {
        host: parsed.hostname,
        port: parsed.port,
        path: parsed.path
      }
      var proxyAuth = request.headers['proxy-authorization']

      http.get(opts, function (res) {
        var body = ''
        res.on('data', function (data) {
          body += data
        })
        res.on('end', function () {
          response.setHeader('Content-Type', 'text/html; charset=UTF-8')
          response.end(JSON.stringify({proxyAuth, body}))
        })
      })
    }).listen(4000, function () {
      process.env.http_proxy = 'http://user:pass@localhost:4000/'
      axios.get(testUri).then(function (res) {
        var base64 = Buffer.from('user:pass', 'utf8').toString('base64')
        expect(res.data.proxyAuth).toBe('Basic ' + base64, 'should authenticate to the proxy')
        done()
      })
    })
  })

  it('does cancel request when cancel request', async () => {
    const source = axios.CancelToken.source()

    nock(testUri)
      .get('/')
      .reply(200, function () {
        source.cancel('Operation has been canceled.')
      })

    try {
      await axios.get(testUri, {
        cancelToken: source.token
      })
      fail('it should have canceled the request')
    } catch (err) {
      expect(err instanceof axios.Cancel).toBe(true, 'Promise must be rejected with a Cancel object')
      expect(err.message).toBe('Operation has been canceled.')
    }
  })
})
