'use strict';

import utils from '../utils.js';
import toFormData from './toFormData.js';
import platform from '../platform/index.js';

/**
 * Converts data to URL encoded form.
 * @param {object} data - The data to be converted.
 * @param {object} options - The options for the conversion.
 * @param {function} options.visitor - The visitor function for the conversion.
 * @returns {object} - The converted data in URL encoded form.
 */
export default function toURLEncodedForm(data, options) {
  return toFormData(data, new platform.classes.URLSearchParams(), Object.assign({
    visitor: function(value, key, path, helpers) {
      if (platform.isNode && utils.isBuffer(value)) {
        this.append(key, value.toString('base64'));
        return false;
      }

      return helpers.defaultVisitor.apply(this, arguments);
    }
  }, options));
}
