'use strict';

import AxiosError from '../core/AxiosError.js';
import parseProtocol from './parseProtocol.js';
import platform from '../platform/index.js';

// RFC 2397: data:[<mediatype>][;base64],<data>
// mediatype = type/subtype followed by optional ;name=value parameters
const DATA_URL_PATTERN = /^([^,;]+\/[^,;]+)?((?:;[^,;=]+=[^,;]+)*)(;base64)?,([\s\S]*)$/;

/**
 * Parse data uri to a Buffer or Blob
 *
 * @param {String} uri
 * @param {?Boolean} asBlob
 * @param {?Object} options
 * @param {?Function} options.Blob
 *
 * @returns {Buffer|Blob}
 */
export default function fromDataURI(uri, asBlob, options) {
  const _Blob = (options && options.Blob) || platform.classes.Blob;
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

    const type = match[1];
    const params = match[2];
    const encoding = match[3] ? 'base64' : 'utf8';
    const body = match[4];

    // RFC 2397 section 3: default mediatype is text/plain;charset=US-ASCII
    // Bare `data:,` leaves mime undefined; Blob normalises that to "" per spec.
    let mime;
    if (type) {
      mime = params ? type + params : type;
    } else if (params) {
      mime = 'text/plain' + params;
    }

    const buffer = Buffer.from(decodeURIComponent(body), encoding);

    if (asBlob) {
      if (!_Blob) {
        throw new AxiosError('Blob is not supported', AxiosError.ERR_NOT_SUPPORT);
      }

      return new _Blob([buffer], { type: mime });
    }

    return buffer;
  }

  throw new AxiosError('Unsupported protocol ' + protocol, AxiosError.ERR_NOT_SUPPORT);
}
