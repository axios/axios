import Axios from './core/Axios'
import mergeConfig from './core/mergeConfig'
import defaults from './defaults'

/**
 * Create an instance of Axios
 *
 * @param {Object} defaultConfig The default config for the instance
 * @return {Axios} A new instance of Axios
 */
function createInstance (defaultConfig) {
  return new Axios(defaultConfig)
}

// Create the default instance to be exported
const axios = createInstance(defaults)

// Factory for creating new instances
axios.create = function create (instanceConfig) {
  return createInstance(mergeConfig(axios.defaults, instanceConfig))
}

export default axios

// Expose Cancel & CancelToken
export { default as Cancel } from './cancel/Cancel'
export { default as CancelToken } from './cancel/CancelToken'
export { default as isCancel } from './cancel/isCancel'

export {
  // Expose Axios class to allow class inheritance
  Axios
}
