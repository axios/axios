import utils from '../utils.js';

// Valid header name pattern (RFC 7230) - strict whitelist
const validHeaderNamePattern = /^[!#$%&'*+\-.0-9A-Z^_`a-z|~]+$/;

// Pattern to remove: CRLF (carriage return + line feed) and null bytes
// These can be used for header injection attacks
const dangerousCharsPattern = /[\r\n\0]/g;

const cleanValue = (val) => {
  if (typeof val !== 'string') return null;

  // Check for injection attempt before cleaning
  const hasInjectionAttempt = dangerousCharsPattern.test(val);

  const cleaned = val.replace(dangerousCharsPattern, '').trim();

  // Log warning if injection attempt detected
  if (hasInjectionAttempt) {
    const injectionType = /[\r\n]/.test(val) ? 'CRLF' : 'null-byte';
    console.warn(`[axios] Header value contains ${injectionType} injection attempt: sanitized automatically`);
  }

  // Return null if string became empty after cleaning
  return cleaned.length > 0 ? cleaned : null;
};

/**
 * Sanitize response headers to prevent header injection and other attacks.
 * Removes CRLF and null byte characters that could enable injection attacks.
 * Modifies headers in-place for memory efficiency.
 *
 * @param {Object} headers - The headers object to sanitize
 * @returns {Object} - Sanitized headers object with dangerous characters removed
 */
export function sanitizeResponseHeaders(headers) {
  if (!utils.isObject(headers)) {
    return headers;
  }

  for (const key in headers) {
    if (!Object.prototype.hasOwnProperty.call(headers, key)) {
      continue;
    }
    // Validate header name against RFC 7230 token rule
    if (!validHeaderNamePattern.test(key)) {
      delete headers[key]; // Remove invalid header names
      continue;
    }

    const value = headers[key];

    if (utils.isArray(value)) {
      const validValues = [];
      for (let i = 0; i < value.length; i++) {
        const cleaned = cleanValue(value[i]);
        if (cleaned !== null) {
          validValues.push(cleaned);
        }
      }

      if (validValues.length > 0) {
        // If only one value remains, store as string; otherwise keep as array
        headers[key] = validValues.length === 1 ? validValues[0] : validValues;
        continue;
      }
    } else if (utils.isString(value)) {
      // Process string value
      const cleaned = cleanValue(value);
      if (cleaned !== null) {
        headers[key] = cleaned;
        continue;
      }
    }
    // Remove header if it didn't pass the validation
    delete headers[key];
  }

  return headers;
}
