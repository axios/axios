'use strict';

import utils from '../utils.js';

/**
 * Safely decode a URI component string. If the input is not a string or
 * decoding fails (malformed percent-encoding), the original value is returned.
 *
 * @param {*} value The value to decode
 *
 * @returns {*} The decoded value, or the original value on failure
 */
const decodeURIComponentSafe = (value) => {
  if (!utils.isString(value)) {
    return value;
  }

  try {
    return decodeURIComponent(value);
  } catch (error) {
    return value;
  }
};

export default decodeURIComponentSafe;
