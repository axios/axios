export default class InterceptorManager {
  constructor () {
    this.handlers = []
  }

  /**
   * Add a new interceptor to the stack
   *
   * @param {Function} fulfilled The function to handle `then` for a `Promise`
   * @param {Function} rejected The function to handle `reject` for a `Promise`
   *
   * @return {Number} An ID used to remove interceptor later
   */

  use (fulfilled, rejected) {
    this.handlers.push({
      fulfilled: fulfilled,
      rejected: rejected
    })
    return this.handlers.length - 1
  }

  /**
   * Remove an interceptor from the stack
   *
   * @param {Number} id The ID that was returned by `use`
   */

  eject (id) {
    if (this.handlers[id]) {
      this.handlers[id] = null
    }
  }

  /**
   * Get all the registered interceptors
   *
   * This method is skipping any interceptors that
   * may have become `null` calling `eject`.
   *
   * @param {Function} fn The function to call for each interceptor
   */

  values () {
    return this.handlers.filter((h) => h !== null)
  }

  /**
   * Applies all interceptor to the seed promise
   *
   * @param {Promise<V>} seed start promise to chain onto
   */

  apply (seed) {
    let promise = seed

    for (const interceptor of this.values()) {
      const { fulfilled, rejected } = interceptor
      promise = promise.then(fulfilled, rejected)
    }

    return promise
  }
}
