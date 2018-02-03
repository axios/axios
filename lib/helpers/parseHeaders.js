'use strict'

const utils = require('./../utils')

// Headers whose duplicates are ignored by node
// c.f. https://nodejs.org/api/http.html#http_message_headers
const ignoreDuplicateOf = [
  'age', 'authorization', 'content-length', 'content-type', 'etag',
  'expires', 'from', 'host', 'if-modified-since', 'if-unmodified-since',
  'last-modified', 'location', 'max-forwards', 'proxy-authorization',
  'referer', 'retry-after', 'user-agent'
]

/**
 * Parse headers into an object
 *
 * ```
 * Date: Wed, 27 Aug 2014 08:58:49 GMT
 * Content-Type: application/json
 * Connection: keep-alive
 * Transfer-Encoding: chunked
 * ```
 *
 * @param {String} headers Headers needing to be parsed
 * @returns {Object} Headers parsed into an object
 */
module.exports = function parseHeaders (headers) {
  const parsed = {}
  let key
  let val
  let i

  if (!headers) { return parsed }

  utils.forEach(headers.split('\n'), function parser (line) {
    i = line.indexOf(':')
    key = utils.trim(line.substr(0, i)).toLowerCase()
    val = utils.trim(line.substr(i + 1))

    if (key) {
      if (parsed[key] && ignoreDuplicateOf.indexOf(key) >= 0) {
        return
      }
      if (key === 'set-cookie') {
        parsed[key] = (parsed[key] ? parsed[key] : []).concat([val])
      } else {
        parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val
      }
    }
  })

  return parsed
}
