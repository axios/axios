'use strict';

import utils from '../utils.js';

function trimSPorHTAB(str) {
  let start = 0;
  let end = str.length;

  while (start < end) {
    const code = str.charCodeAt(start);

    if (code !== 0x09 && code !== 0x20) {
      break;
    }

    start += 1;
  }

  while (end > start) {
    const code = str.charCodeAt(end - 1);

    if (code !== 0x09 && code !== 0x20) {
      break;
    }

    end -= 1;
  }

  return start === 0 && end === str.length ? str : str.slice(start, end);
}

function sanitizeValue(value, isValidChar) {
  if (utils.isArray(value)) {
    return value.map((item) => sanitizeValue(item, isValidChar));
  }

  const str = String(value);
  let sanitized = '';

  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);

    if (isValidChar(code)) {
      sanitized += str[i];
    }
  }

  return trimSPorHTAB(sanitized);
}

const isValidUnicodeHeaderValueChar = (code) =>
  (code >= 0x20 || code === 0x09) && code !== 0x7f;

const isValidByteStringHeaderValueChar = (code) =>
  code === 0x09 || (code >= 0x20 && code <= 0x7e) || (code >= 0x80 && code <= 0xff);

export const sanitizeHeaderValue = (value) => sanitizeValue(value, isValidUnicodeHeaderValueChar);

export const sanitizeByteStringHeaderValue = (value) =>
  sanitizeValue(value, isValidByteStringHeaderValueChar);

export function toByteStringHeaderObject(headers) {
  const byteStringHeaders = Object.create(null);

  utils.forEach(headers.toJSON(), (value, header) => {
    byteStringHeaders[header] = sanitizeByteStringHeaderValue(value);
  });

  return byteStringHeaders;
}
