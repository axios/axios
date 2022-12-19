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
  const combined = relativeURL
    ? (
        (baseURL.charAt(baseURL.length - 1) === '/' ? trimSlashes(baseURL, true) : baseURL)
        + '/'
        + (relativeURL.charAt(0) === '/' ? trimSlashes(relativeURL) : relativeURL)
      )
    : baseURL;

  // corner case: if one of the original URLs has multiple slashes which do not reside at the end (for the `baseURL`) or
  // at the start (for the `relativeURL`), we sanitize them here. avoidance of regex is deliberate, in order to avoid
  // polynomial runtime complexity.
  //
  // since the `baseURL` and `relativeURL` are guaranteed not to have such artifacts at the end, or beginning,
  // respectively (by `trimSlashes`), we only need to do a quick check for the presence of a double-slash. if there is
  // none present, we can bail and return the combined URL.
  //
  // See more: CWE-1333, CWE-400, CWE-730 (https://cwe.mitre.org/index.html)
  //
  // since Axios only supports a limited set of protocols on each platform, we can safely predict where the protocol
  // specifier will be. Then, we can scan the inverse range for any double-slashes. If there is no protocol present (as
  // is the case for relative URLs), we can simply scan the string.
  //
  // the full suite of supported protocol prefixes across all platforms is:
  // `['http', 'https', 'file', 'blob', 'url', 'data']`
  //
  // these are all either three, four, or five characters long (in the lone case of `https`). we use these offsets to
  // probe for the protocol string, without iterating, and then proceed as above.
  const protocolMinimumOffset = 3 + 1;  // 3 character minimum + 1 to arrive at `:`
  const protocolMaximumOffset = 5 + 1;  // 5 character maximum + 1 to arrive at `:`
  const combinedLength = combined.length;
  const offset = Math.min(combinedLength, (protocolMaximumOffset + 2));
  let sub = combined;

  /* eslint-disable */
  let protocolPosition = -1;

  // if the combined URLs are shorter than the minimum, there is no protocol by definition, and the URLs are both
  // relative (and both very small). because we want the offset of the protocol separator, we return `-1` to
  // indicate it was not found, or `1` to continue processing (we don't know where it is yet).
  if (!(combinedLength < protocolMinimumOffset)) {
    // now that we know it's at least as long as the minimum, we can safely slice and check for the protocol tail. the
    // length of the string can still be less than the maximum offset + 2, though, so we take the minimum of that and
    // the length of the combined string to prevent overflows. at the same time, we assign the smaller search string to
    // the subject, so that we don't have to slice it again, and OR-it to the next step.
    protocolPosition = ((sub = sub.slice(0, offset)) || sub).includes('://') ?
        // we've found the protocol separator; return the start position. since we may have sliced the search space,
        // there may or may not be an offset to apply. otherwise, we just return -1 to indicate it was not found (i.e.
        // in the case of a relative base URL. since the `indexOf` returns the start of the string, we add `3` to
        // include the protocol separator itself.
        (sub.indexOf('://') + offset + 3) : -1;
  }


  // use the above metric to calculate the minimum search space for double-slashes which need to be sanitized.
  const doubleSlashSearch = protocolPosition === -1 ? combined : combined.slice(protocolPosition);

  // check for double slashes in the target search space. if found, build the return value character by character,
  // dropping repeated slashes as we go.
  if (doubleSlashSearch.includes('//')) {
    let previous = '';
    let charIndex = 0;
    let charsTotal = doubleSlashSearch.length;
    let sanitized = '';

    while (charIndex < charsTotal) {
      const char = doubleSlashSearch.charAt(charIndex);
      if (char === '/' && previous === '/') {
        // skip this character
      } else {
        sanitized += char;
      }
      previous = char;
      charIndex++;
    }

    // finally, if we trimmed the protocol from the search space, we need to combine it again before we return.
    return protocolPosition === -1 ? `${combined.slice(0, protocolPosition)}${sanitized}` : sanitized;
  }
  return combined;
}
