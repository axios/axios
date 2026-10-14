'use strict';

import AxiosError from '../core/AxiosError.js';
import parseProtocol from './parseProtocol.js';
import platform from '../platform/index.js';

// RFC 2397: data:[<mediatype>][;base64],<data>
// mediatype = type/subtype followed by optional ;name=value parameters
// The `i` flag makes the `;base64` token case-insensitive, matching the WHATWG
// URL/Fetch data URL processor (and therefore the fetch adapter and browsers).
// The remaining character classes do not depend on letter case.
const DATA_URL_PATTERN = /^([^,;/]+\/[^,;/]+)?((?:;[^,;=]+=[^,;]+)*)(;base64)?,([\s\S]*)$/i;

const percentDecode = (str) =>
  str.replace(/%([\da-f]{2})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));

const hexValue = (code) => {
  if (code >= 0x30 && code <= 0x39) return code - 0x30;
  if (code >= 0x61 && code <= 0x66) return code - 0x57;
  if (code >= 0x41 && code <= 0x46) return code - 0x37;
  return -1;
};

// Decodes in place over the UTF-8 bytes: the write index never passes the read index.
const percentDecodeToBytes = (str) => {
  const bytes = Buffer.from(str, 'utf8');
  const length = bytes.length;
  let n = 0;

  for (let i = 0; i < length; i++) {
    const byte = bytes[i];

    if (byte === 0x25 && i + 2 < length) {
      const hi = hexValue(bytes[i + 1]);
      const lo = hexValue(bytes[i + 2]);

      if (hi !== -1 && lo !== -1) {
        bytes[n++] = (hi << 4) | lo;
        i += 2;
        continue;
      }
    }

    bytes[n++] = byte;
  }

  return n === length ? bytes : bytes.subarray(0, n);
};

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
    let mime = '';
    if (type) {
      mime = params ? type + params : type;
    } else if (params) {
      mime = 'text/plain' + params;
    }

    // Non-base64 bodies are percent-decoded to bytes as in RFC 2397 and Fetch: invalid
    // escapes stay literal and the bytes need not form UTF-8, unlike decodeURIComponent.
    const buffer =
      encoding === 'base64'
        ? Buffer.from(percentDecode(body), 'base64')
        : percentDecodeToBytes(body);

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
