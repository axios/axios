'use strict';
import AxiosError from '../core/AxiosError.js';

// export default function parseProtocol(url) {
//   const match = /^([-+\w]{1,25})(:?\/\/|:)/.exec(url);
//   return match && match[1] || '';
// }


/**
 * Extracts the protocol from a URL string.
 * Returns the protocol WITHOUT colon (e.g., 'http').
 * Returns empty string for protocol-relative URLs (starting with //).
 * @param {string} url
 * @returns {string} protocol
 */
export default function parseProtocol(url) {
  if (typeof url !== 'string') {
    throw new AxiosError(`Malformed URL: "${url}". Must be a string.`);
  }

  // Empty string is valid - returns empty string
  if (url.length === 0) return '';

  // Handle data URL separately - return 'data' not 'data:'
  if (url.toLowerCase().startsWith('data:')) return 'data';

  // Original regex pattern from the codebase: /^([-+\w]{1,25})(:?\/\/|:)/
  // This matches protocol (1-25 chars of letters, numbers, _, +, -) followed by :// or just :
  const match = /^([-+\w]{1,25})(:?\/\/|:)/.exec(url);

  // Return the protocol part (group 1) or empty string if no match
  return match ? match[1] : '';
}
