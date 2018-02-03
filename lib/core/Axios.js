import { merge } from 'lodash'
import InterceptorManager from './InterceptorManager'
import dispatchRequest from './dispatchRequest'
import mergeConfig from './mergeConfig'

class Axios {
  /**
   * Create a new instance of Axios
   *
   * @param {Object} instanceConfig The default config for the instance
   */
  constructor (instanceConfig) {
    this.defaults = instanceConfig
    this.interceptors = {
      request: new InterceptorManager(),
      response: new InterceptorManager()
    }
  }

  request (config) {
    /* eslint no-param-reassign:0 */
    // Allow for axios('example/url'[, config]) a la fetch API
    if (typeof config === 'string') {
      config = arguments[1] || {}
      config.url = arguments[0]
    } else {
      config = config || {}
    }

    config = mergeConfig(this.defaults, config)
    config.method = config.method ? config.method.toLowerCase() : 'get'

    // Hook up interceptors middleware
    const finalConfig = this.interceptors.request.apply(Promise.resolve(config))
    const request = finalConfig.then(dispatchRequest)
    const finalResponse = this.interceptors.response.apply(request)

    return finalResponse
  }

  // Provide aliases for supported request methods
  get (url, config) {
    return this.methodNoData('get', url, config)
  }

  delete (url, config) {
    return this.methodNoData('delete', url, config)
  }

  head (url, config) {
    return this.methodNoData('head', url, config)
  }

  options (url, config) {
    return this.methodNoData('options', url, config)
  }

  post (url, data, config) {
    return this.methodWithData('post', url, data, config)
  }

  put (url, data, config) {
    return this.methodWithData('put', url, data, config)
  }

  patch (url, data, config) {
    return this.methodWithData('patch', url, data, config)
  }

  methodNoData (method, url, config) {
    return this.request(merge(config || {}, {
      method: method,
      url: url
    }))
  }

  methodWithData (method, url, data, config) {
    return this.request(merge(config || {}, {
      method: method,
      url: url,
      data: data
    }))
  }
}

export default Axios
