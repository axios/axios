'use strict'

import {
  isFormData,
  isFile,
  isStream,
  isBlob,
  isArrayBufferView,
  isURLSearchParams
} from './utils'

import {
  isUndefined,
  isBuffer,
  isArrayBuffer,
  isObject,
  forEach,
  merge
} from 'lodash'

const normalizeHeaderName = require('./helpers/normalizeHeaderName')

const DEFAULT_CONTENT_TYPE = {
  'Content-Type': 'application/x-www-form-urlencoded'
}

function setContentTypeIfUnset (headers, value) {
  if (!isUndefined(headers) && isUndefined(headers['Content-Type'])) {
    headers['Content-Type'] = value
  }
}

function getDefaultAdapter () {
  let adapter
  // Only Node.JS has a process variable that is of [[Class]] process
  if (typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]') {
    // For node use HTTP adapter
    adapter = require('./adapters/http')
  } else if (typeof XMLHttpRequest !== 'undefined') {
    // For browsers use XHR adapter
    adapter = require('./adapters/xhr')
  }
  return adapter
}

const defaults = {
  adapter: getDefaultAdapter(),

  transformRequest: [function transformRequest (data, headers) {
    normalizeHeaderName(headers, 'Content-Type')
    if (isFormData(data) ||
      isArrayBuffer(data) ||
      isBuffer(data) ||
      isStream(data) ||
      isFile(data) ||
      isBlob(data)
    ) {
      return data
    }
    if (isArrayBufferView(data)) {
      return data.buffer
    }
    if (isURLSearchParams(data)) {
      setContentTypeIfUnset(headers, 'application/x-www-form-urlencoded;charset=utf-8')
      return data.toString()
    }
    if (isObject(data)) {
      setContentTypeIfUnset(headers, 'application/json;charset=utf-8')
      return JSON.stringify(data)
    }
    return data
  }],

  transformResponse: [function transformResponse (data) {
    /* eslint no-param-reassign:0 */
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data)
      } catch (e) { /* Ignore */ }
    }
    return data
  }],

  /**
   * A timeout in milliseconds to abort a request. If set to 0 (default) a
   * timeout is not created.
   */
  timeout: 0,

  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',

  maxContentLength: -1,

  validateStatus: function validateStatus (status) {
    return status >= 200 && status < 300
  }
}

defaults.headers = {
  common: {
    'Accept': 'application/json, text/plain, */*'
  }
}

forEach(['delete', 'get', 'head'], function forEachMethodNoData (method) {
  defaults.headers[method] = {}
})

forEach(['post', 'put', 'patch'], function forEachMethodWithData (method) {
  defaults.headers[method] = merge({}, DEFAULT_CONTENT_TYPE)
})

export default defaults
