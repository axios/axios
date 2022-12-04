'use strict';

import utils from '../utils.js';
import {FormDataSerializer} from './Serializers.js';

/**
 * It converts an object into a FormData object
 *
 * @param {Object} obj
 * @param {?Object} [options]
 * @param {Function} [options.visitor]
 * @param {Boolean} [options.metaTokens = true]
 * @param {Boolean} [options.dots = false]
 * @param {?Boolean} [options.indexes = false]
 *
 * @returns {Object}
 **/

export default function toFormData(obj, options) {
  // check that the context is not AxiosStatic
  const formData = utils.isFunction(this) ? null : this;

  if (formData && !utils.isFunction(formData.append)) {
    throw new TypeError('target must implement append method');
  }

  return new FormDataSerializer(options).serialize(obj, formData);
}
