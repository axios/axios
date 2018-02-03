'use strict'

const utils = require('./utils')
const bind = require('./helpers/bind')
const Axios = require('./core/Axios')
const mergeConfig = require('./core/mergeConfig')
const defaults = require('./defaults')

/**
 * Create an instance of Axios
 *
 * @param {Object} defaultConfig The default config for the instance
 * @return {Axios} A new instance of Axios
 */
function createInstance (defaultConfig) {
  const context = new Axios(defaultConfig)
  const instance = bind(Axios.prototype.request, context)

  // Copy axios.prototype to instance
  utils.extend(instance, Axios.prototype, context)

  // Copy context to instance
  utils.extend(instance, context)

  return instance
}

// Create the default instance to be exported
const axios = createInstance(defaults)

// Expose Axios class to allow class inheritance
axios.Axios = Axios

// Factory for creating new instances
axios.create = function create (instanceConfig) {
  return createInstance(mergeConfig(axios.defaults, instanceConfig))
}

// Expose Cancel & CancelToken
axios.Cancel = require('./cancel/Cancel')
axios.CancelToken = require('./cancel/CancelToken')
axios.isCancel = require('./cancel/isCancel')

// Expose all/spread
axios.all = function all (promises) {
  return Promise.all(promises)
}
axios.spread = require('./helpers/spread')

module.exports = axios

// Allow use of default import syntax in TypeScript
module.exports.default = axios
