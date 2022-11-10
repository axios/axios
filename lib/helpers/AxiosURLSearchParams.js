'use strict';

import utils from "../utils.js";

/**
 * It takes a params object and converts it to a FormData object
 *
 * @param {Object<string, any>} params - The parameters to be converted to a FormData object.
 * @param {Object<string, any>} options - The options object passed to the Axios constructor.
 *
 * @returns {void}
 */

class AxiosURLSearchParams {
  constructor(params) {
    this._pairs = params ? params.slice() : [];
  }

  append(name, value) {
    this._pairs.push([name, value]);
  }

  toString(encoder) {
    const _encode = encoder ? (value) => encoder.call(this, value, utils.encodeURIComponent) : utils.encodeURIComponent;

    return this._pairs.filter(([, value])=> !utils.isUndefined(value))
      .map(([key, value]) => _encode(key) + (value !== null ? '=' + _encode(value) : '')).join('&');
  }
}

export default AxiosURLSearchParams
