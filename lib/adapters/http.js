'use strict'

const utils = require('./../utils')
const settle = require('./../core/settle')
const buildURL = require('./../helpers/buildURL')
const http = require('http')
const https = require('https')
const httpFollow = require('follow-redirects').http
const httpsFollow = require('follow-redirects').https
const url = require('url')
const zlib = require('zlib')
const createError = require('../core/createError')
const enhanceError = require('../core/enhanceError')
const pkginfo = require('pkginfo')(module)

/* eslint consistent-return:0 */
module.exports = function httpAdapter (config) {
  return new Promise(function dispatchHttpRequest (resolve, reject) {
    let data = config.data
    const headers = config.headers
    let timer

    // Set User-Agent (required by some servers)
    // Only set header if it hasn't been set in config
    // See https://github.com/axios/axios/issues/69
    if (!headers['User-Agent'] && !headers['user-agent']) {
      headers['User-Agent'] = 'axios/' + pkginfo.version
    }

    if (data && !utils.isStream(data)) {
      if (Buffer.isBuffer(data)) {
        // Nothing to do...
      } else if (utils.isArrayBuffer(data)) {
        data = Buffer.from(new Uint8Array(data))
      } else if (utils.isString(data)) {
        data = Buffer.from(data, 'utf-8')
      } else {
        return reject(createError(
          'Data after transformation must be a string, an ArrayBuffer, a Buffer, or a Stream',
          config
        ))
      }

      // Add Content-Length header if data exists
      headers['Content-Length'] = data.length
    }

    // HTTP basic authentication
    let auth
    if (config.auth) {
      const username = config.auth.username || ''
      const password = config.auth.password || ''
      auth = username + ':' + password
    }

    // Parse url
    const parsed = url.parse(config.url)
    const protocol = parsed.protocol || 'http:'

    if (!auth && parsed.auth) {
      const urlAuth = parsed.auth.split(':')
      const urlUsername = urlAuth[0] || ''
      const urlPassword = urlAuth[1] || ''
      auth = urlUsername + ':' + urlPassword
    }

    if (auth) {
      delete headers.Authorization
    }

    const isHttps = protocol === 'https:'
    const agent = isHttps ? config.httpsAgent : config.httpAgent

    const options = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: buildURL(parsed.path, config.params, config.paramsSerializer).replace(/^\?/, ''),
      method: config.method,
      headers: headers,
      agent: agent,
      auth: auth
    }

    let proxy = config.proxy
    if (!proxy && proxy !== false) {
      const proxyEnv = protocol.slice(0, -1) + '_proxy'
      const proxyUrl = process.env[proxyEnv] || process.env[proxyEnv.toUpperCase()]
      if (proxyUrl) {
        const parsedProxyUrl = url.parse(proxyUrl)
        proxy = {
          host: parsedProxyUrl.hostname,
          port: parsedProxyUrl.port
        }

        if (parsedProxyUrl.auth) {
          const proxyUrlAuth = parsedProxyUrl.auth.split(':')
          proxy.auth = {
            username: proxyUrlAuth[0],
            password: proxyUrlAuth[1]
          }
        }
      }
    }

    if (proxy) {
      options.hostname = proxy.host
      options.host = proxy.host
      options.headers.host = parsed.hostname + (parsed.port ? ':' + parsed.port : '')
      options.port = proxy.port
      options.path = protocol + '//' + parsed.hostname + (parsed.port ? ':' + parsed.port : '') + options.path

      // Basic proxy authorization
      if (proxy.auth) {
        const base64 = Buffer.from(proxy.auth.username + ':' + proxy.auth.password, 'utf8').toString('base64')
        options.headers['Proxy-Authorization'] = 'Basic ' + base64
      }
    }

    let transport
    if (config.transport) {
      transport = config.transport
    } else if (config.maxRedirects === 0) {
      transport = isHttps ? https : http
    } else {
      if (config.maxRedirects) {
        options.maxRedirects = config.maxRedirects
      }
      transport = isHttps ? httpsFollow : httpFollow
    }

    // Create the request
    const req = transport.request(options, function handleResponse (res) {
      if (req.aborted) return

      // Response has been received so kill timer that handles request timeout
      clearTimeout(timer)
      timer = null

      // uncompress the response body transparently if required
      let stream = res
      switch (res.headers['content-encoding']) {
      /* eslint default-case:0 */
        case 'gzip':
        case 'compress':
        case 'deflate':
        // add the unzipper to the body stream processing pipeline
          stream = stream.pipe(zlib.createUnzip())

          // remove the content-encoding in order to not confuse downstream operations
          delete res.headers['content-encoding']
          break
      }

      // return the last request in case of redirects
      const lastRequest = res.req || req

      const response = {
        status: res.statusCode,
        statusText: res.statusMessage,
        headers: res.headers,
        config: config,
        request: lastRequest
      }

      if (config.responseType === 'stream') {
        response.data = stream
        settle(resolve, reject, response)
      } else {
        const responseBuffer = []
        stream.on('data', function handleStreamData (chunk) {
          responseBuffer.push(chunk)

          // make sure the content length is not over the maxContentLength if specified
          if (config.maxContentLength > -1 && Buffer.concat(responseBuffer).length > config.maxContentLength) {
            reject(createError('maxContentLength size of ' + config.maxContentLength + ' exceeded',
              config, null, lastRequest))
          }
        })

        stream.on('error', function handleStreamError (err) {
          if (req.aborted) return
          reject(enhanceError(err, config, null, lastRequest))
        })

        stream.on('end', function handleStreamEnd () {
          let responseData = Buffer.concat(responseBuffer)
          if (config.responseType !== 'arraybuffer') {
            responseData = responseData.toString('utf8')
          }

          response.data = responseData
          settle(resolve, reject, response)
        })
      }
    })

    // Handle errors
    req.on('error', function handleRequestError (err) {
      if (req.aborted) return
      reject(enhanceError(err, config, null, req))
    })

    // Handle request timeout
    if (config.timeout && !timer) {
      timer = setTimeout(function handleRequestTimeout () {
        req.abort()
        reject(createError('timeout of ' + config.timeout + 'ms exceeded', config, 'ECONNABORTED', req))
      }, config.timeout)
    }

    if (config.cancelToken) {
      // Handle cancellation
      config.cancelToken.promise.then(function onCanceled (cancel) {
        if (req.aborted) return

        req.abort()
        reject(cancel)
      })
    }

    // Send the request
    if (utils.isStream(data)) {
      data.pipe(req)
    } else {
      req.end(data)
    }
  })
}
