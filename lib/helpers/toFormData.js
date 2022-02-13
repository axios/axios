'use strict';

var utils = require('../utils');

function combinedKey(parentKey, elKey) {
  return parentKey + '.' + elKey;
}

function buildFormData(formData, data, parentKey) {
  if (Array.isArray(data)) {
    data.forEach(function buildArray(el, i) {
      buildFormData(formData, el, combinedKey(parentKey, i));
    });
  } else if (
    typeof data === 'object' &&
    !(utils.isFile(data) || data === null)
  ) {
    Object.keys(data).forEach(function buildObject(key) {
      buildFormData(
        formData,
        data[key],
        parentKey ? combinedKey(parentKey, key) : key
      );
    });
  } else {
    if (data === undefined) {
      return;
    }

    var value =
      typeof data === 'boolean' || typeof data === 'number'
        ? data.toString()
        : data;
    formData.append(parentKey, value);
  }
}

/**
 * convert a data object to FormData
 *
 * type FormDataPrimitive = string | Blob | number | boolean
 * interface FormDataNest {
 *   [x: string]: FormVal
 * }
 *
 * type FormVal = FormDataNest | FormDataPrimitive
 *
 * @param {FormVal} data
 * @param {?Object} formData
 */

module.exports = function getFormData(data, formData) {
  // eslint-disable-next-line no-param-reassign
  formData = formData || new FormData();

  buildFormData(formData, data);

  return formData;
};
