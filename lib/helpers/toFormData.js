'use strict';
var stream = require('stream');
var NodeFormData = require('form-data');
// var NodeFormData = require('formdata-polyfill');

/* ----- Node  ----------*/
var nodeEnv =
   typeof process !== 'undefined' &&
   Object.prototype.toString.call(process) === '[object process]';

function isNodeStream(val) {
  return val instanceof stream.Readable;
}

/* ----- Helpers  ----------*/

function combinedKey(parentKey, elKey) {
  return parentKey + '.' + elKey;
}

function isKeyValueObject(val) {
  if (typeof val !== 'object') {
    return false;
  }
  if (typeof val === null) {
    return false;
  }
  if (!nodeEnv && val instanceof Blob) {
    return false;
  }
  if (nodeEnv && isNodeStream(val)) {
    return false;
  }
  return true;
}

/* ----- toFormData  ----------*/

function buildFormData(formData, data, parentKey) {
  if (Array.isArray(data)) {
    data.forEach(function buildArray(el, i) {
      buildFormData(formData, el, combinedKey(parentKey, i));
    });
  } else if (isKeyValueObject(data)) {
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
 *  [x: string]: FormVal
 * }
 *
 * type FormVal = FormDataNest | FormDataPrimitive
 *
 * @param {FormVal} data
 */

module.exports = function getFormData(data) {
  var formData = nodeEnv ? new NodeFormData() : new FormData();
  buildFormData(formData, data);

  return formData;
};

