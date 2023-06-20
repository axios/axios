'use strict';

import AxiosError from '../core/AxiosError.js';
import parseProtocol from './parseProtocol.js';
import platform from '../platform/index.js';

const DATA_URL_PATTERN = /^(?:([^;]+);)?(?:[^;]+;)?(base64|),([\s\S]*)$/;

/**
 * Parses a data URI to a Buffer or Blob.
 *
 * @param {string} uri - The data URI to parse.
 * @param {boolean} [asBlob] - Whether to return a Blob instead of a Buffer. Defaults to true if options.Blob is available.
 * @param {Object} [options] - Optional options object.
 * @param {Function} [options.Blob] - The Blob constructor to use. If not provided, the platform's default Blob constructor will be used.
 *
 * @returns {Buffer|Blob} - The parsed data as a Buffer or Blob.
 */
export default function fromDataURI(uri, asBlob, options) {
  const _Blob = options && options.Blob || platform.classes.Blob;
  const protocol = parseProtocol(uri);

  if (asBlob === undefined && _Blob) {
    asBlob = true;
  }

  if (protocol === 'data') {
    uri = protocol.length ? uri.slice(protocol.length + 1) : uri;

    const match = DATA_URL_PATTERN.exec(uri);

    if (!match) {
      throw new AxiosError('Invalid URL', AxiosError.ERR_INVALID_URL);
    }

    const mime = match[1];
    const isBase64 = match[2];
    const body = match[3];
    const buffer = Buffer.from(decodeURIComponent(body), isBase64 ? 'base64' : 'utf8');

    if (asBlob) {
      if (!_Blob) {
        throw new AxiosError('Blob is not supported', AxiosError.ERR_NOT_SUPPORT);
      }

      return new _Blob([buffer], {type: mime});
    }

    return buffer;
  }

  throw new AxiosError('Unsupported protocol ' + protocol, AxiosError.ERR_NOT_SUPPORT);
}
