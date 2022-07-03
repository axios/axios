'use strict';

import toFormData from './toFormData.js';

/**
 * It encodes a string by replacing all characters that are not in the unreserved set with
 * their percent-encoded equivalents
 *
 * @param {string} str - The string to encode.
 *
 * @returns {string} The encoded string.
 */
function encode(str: string) {
  const charMap = {
    '!': '%21',
    "'": '%27',
    '(': '%28',
    ')': '%29',
    '~': '%7E',
    '%20': '+',
    '%00': '\x00'
  } as Record<string, string>;
  return encodeURIComponent(str).replace(/[!'()~]|%20|%00/g, function replacer(match) {
    return charMap[match];
  });
}

/**
 * It takes a params object and converts it to a FormData object
 *
 * @param {Object<string, any>} params - The parameters to be converted to a FormData object.
 * @param {Object<string, any>} options - The options object passed to the Axios constructor.
 *
 * @returns {void}
 */
export default class AxiosURLSearchParams {
  _pairs: [string, any][]

  constructor(params: Record<string, any>, options: Record<string, any>) {
    this._pairs = [];

    params && toFormData(params, this, options);
  }

  append(name: string, value: any) {
    this._pairs.push([name, value]);
  };

  toString(encoder: (value: string, encode: (str: string) => string) => string) {
    const _encode = encoder ? (value: string) => {
      return encoder.call(this, value, encode);
    } : encode;

    return this._pairs.map((pair) => {
      return _encode(pair[0]) + '=' + _encode(pair[1]);
    }, '').join('&');
  };
};