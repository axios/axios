'use strict';

/**
 * Trim `n` slashes from the start or `end` of a `subject` string.
 *
 * @param {!string} subject String to trim slashes from.
 * @param {boolean=} opt_end Whether to trim from the end of the string. If not passed or passed as `false`, the start
 *   of the string is inspected instead.
 * @return {!string} String with slashes trimmed from either the start or end of the string.
 */
function trimSlashes(subject, opt_end) {
  const originalLength = subject.length;
  const getSubjectChar = () => subject.charAt(opt_end === true ? subject.length - 1 : 0);
  const trimOne = () => subject = opt_end === true ? subject.slice(0, subject.length - 1) : subject.slice(1);

  let char = getSubjectChar();
  let iterations = 0;

  while (char === '/') {
    iterations++;
    trimOne();
    char = getSubjectChar();
    if (iterations > originalLength) {
      break;  // shouldn't infinite loop, but this protection guarantees it won't look past the length of the string
    }
  }
  return subject;
}

/**
 * Creates a new URL by combining the specified URLs
 *
 * @param {string} baseURL The base URL
 * @param {string} relativeURL The relative URL
 *
 * @returns {string} The combined URL
 */
export default function combineURLs(baseURL, relativeURL) {
  return relativeURL
    ? baseURL.replace(/\/?\/$/, '') + '/' + trimSlashes(relativeURL.replace(/^\/+/, ''))
    : baseURL;
}
