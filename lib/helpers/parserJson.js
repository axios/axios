'use strict';

export default function parseJson(rawValue) {
  try {
    return JSON.parse(rawValue);
  } catch (error) {
    const parseError = new SyntaxError('Failed to parse JSON response');
    parseError.originalError = error;
    parseError.rawValue = rawValue;
    throw parseError;
  }
}
