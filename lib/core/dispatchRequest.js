import { merge, forEach } from 'lodash'

import transformData from './transformData'
import defaults from '../defaults'
const isCancel = require('../cancel/isCancel')
const isAbsoluteURL = require('./../helpers/isAbsoluteURL')
const combineURLs = require('./../helpers/combineURLs')

/**
 * Throws a `Cancel` if cancellation has been requested.
 */
function throwIfCancellationRequested (config) {
  if (config.cancelToken) {
    config.cancelToken.throwIfRequested()
  }
}

/**
 * Dispatch a request to the server using the configured adapter.
 *
 * @param {object} config The config that is to be used for the request
 * @returns {Promise} The Promise to be fulfilled
 */
function dispatchRequest (config) {
  throwIfCancellationRequested(config)

  // Support baseURL config
  if (config.baseURL && !isAbsoluteURL(config.url)) {
    config.url = combineURLs(config.baseURL, config.url)
  }

  // Ensure headers exist
  config.headers = config.headers || {}

  // Transform request data
  config.data = transformData(
    config.data,
    config.headers,
    config.transformRequest
  )

  // Flatten headers
  config.headers = merge(
    {},
    config.headers.common || {},
    config.headers[config.method] || {},
    config.headers || {}
  )

  forEach(
    ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
    function cleanHeaderConfig (method) {
      delete config.headers[method]
    }
  )

  const adapter = config.adapter || defaults.adapter

  return adapter(config).then(function onAdapterResolution (response) {
    throwIfCancellationRequested(config)

    // Transform response data
    response.data = transformData(
      response.data,
      response.headers,
      config.transformResponse
    )

    return response
  }, function onAdapterRejection (reason) {
    if (!isCancel(reason)) {
      throwIfCancellationRequested(config)

      // Transform response data
      if (reason && reason.response) {
        reason.response.data = transformData(
          reason.response.data,
          reason.response.headers,
          config.transformResponse
        )
      }
    }

    return Promise.reject(reason)
  })
}

export default dispatchRequest
