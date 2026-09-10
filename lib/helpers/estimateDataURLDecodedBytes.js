/**
 * Estimate data: URL byte lengths *without* allocating large buffers.
 * - Fetch percent-decodes a base64 body before decoding it.
 * - Node's Buffer.from(body, 'base64') sizes its backing allocation from the
 *   raw body, including ignored characters and content after padding.
 * - Non-base64 data is percent-decoded and then encoded as UTF-8.
 */
const isHexDigit = (charCode) =>
  (charCode >= 48 && charCode <= 57) ||
  (charCode >= 65 && charCode <= 70) ||
  (charCode >= 97 && charCode <= 102);

const isPercentEncodedByte = (str, i, len) =>
  i + 2 < len && isHexDigit(str.charCodeAt(i + 1)) && isHexDigit(str.charCodeAt(i + 2));

const hexValue = (charCode) => (charCode <= 57 ? charCode - 48 : (charCode & 0xdf) - 55);

const isBase64Char = (charCode) =>
  (charCode >= 65 && charCode <= 90) || // A-Z
  (charCode >= 97 && charCode <= 122) || // a-z
  (charCode >= 48 && charCode <= 57) || // 0-9
  charCode === 43 || // +
  charCode === 47 || // /
  charCode === 45 || // - (base64url)
  charCode === 95; // _ (base64url)

// The ASCII whitespace forgiving-base64 decoding skips in a body. Used only
// there: the media type is scanned by isBase64MediaType, which allows U+0020.
const isASCIIWhitespace = (charCode) =>
  charCode === 9 || charCode === 10 || charCode === 12 || charCode === 13 || charCode === 32;

const BASE64_TOKEN = 'base64';

/**
 * A data: URL body is base64 only when the media type *ends* with `;`, optional
 * spaces, then `base64` (ASCII case-insensitive). A `base64` token anywhere else
 * — most of all a parameter named `base64`, as in `text/plain;base64=x` — leaves
 * the body percent-decoded, so a substring test would size it as base64 and
 * under-report by up to 4x.
 *
 * Only U+0020 is skipped around the token: the URL parser has already deleted
 * tab/LF/CR and percent-encoded U+000C, so nothing else is still whitespace here.
 */
const isBase64MediaType = (meta) => {
  let end = meta.length;

  while (end > 0 && meta.charCodeAt(end - 1) === 32 /* ' ' */) {
    end--;
  }

  let start = end - BASE64_TOKEN.length;

  if (start < 1 || meta.slice(start, end).toLowerCase() !== BASE64_TOKEN) {
    return false;
  }

  while (start > 0 && meta.charCodeAt(start - 1) === 32 /* ' ' */) {
    start--;
  }

  return start > 0 && meta.charCodeAt(start - 1) === 59; /* ';' */
};

const base64Bytes = (significant) => {
  const groups = Math.floor(significant / 4);
  const remainder = significant % 4;
  return groups * 3 + (remainder === 2 ? 1 : remainder === 3 ? 2 : 0);
};

// Buffer.byteLength(body, 'base64') uses the raw string length as an allocation
// upper bound even when Buffer.from later ignores characters or stops at '='.
const estimateBase64BufferAllocation = (body) => {
  const len = body.length;
  let padding = 0;

  if (len > 0 && body.charCodeAt(len - 1) === 61 /* '=' */) {
    padding++;

    if (len > 1 && body.charCodeAt(len - 2) === 61 /* '=' */) {
      padding++;
    }
  }

  return Math.floor(((len - padding) * 3) / 4);
};

const estimatePercentDecodedBase64Bytes = (body) => {
  const len = body.length;
  let significant = 0;
  let padding = 0;
  let invalid = false;

  for (let i = 0; i < len; i++) {
    let code = body.charCodeAt(i);

    if (code === 37 /* '%' */ && isPercentEncodedByte(body, i, len)) {
      code = hexValue(body.charCodeAt(i + 1)) * 16 + hexValue(body.charCodeAt(i + 2));
      i += 2;
    }

    if (isASCIIWhitespace(code)) {
      continue;
    }

    if (code === 61 /* '=' */) {
      padding++;
      continue;
    }

    if (!isBase64Char(code) || padding > 0) {
      invalid = true;
      continue;
    }

    significant++;
  }

  // Fetch rejects malformed forgiving-base64 input. Returning the raw-size
  // allocation bound keeps that invalid input from becoming a pre-check bypass.
  if (
    invalid ||
    padding > 2 ||
    (padding > 0 && (significant + padding) % 4 !== 0) ||
    significant % 4 === 1
  ) {
    return estimateBase64BufferAllocation(body);
  }

  return base64Bytes(significant);
};

const estimateDataURLBytes = (url, estimateBase64) => {
  if (!url || typeof url !== 'string') return 0;
  if (!url.startsWith('data:')) return 0;

  const comma = url.indexOf(',');
  if (comma < 0) return 0;

  const meta = url.slice(5, comma);
  const body = url.slice(comma + 1);

  if (isBase64MediaType(meta)) {
    return estimateBase64(body);
  }

  // Compute UTF-8 byte length directly from UTF-16 code units without allocating
  // a byte buffer (TextEncoder.encode would defeat the DoS guard on large bodies).
  // Valid %XX triplets count as one decoded byte; this matches the bytes that
  // decodeURIComponent(body) would produce before Buffer re-encodes the string.
  let bytes = 0;
  for (let i = 0, len = body.length; i < len; i++) {
    const c = body.charCodeAt(i);
    if (c === 37 /* '%' */ && isPercentEncodedByte(body, i, len)) {
      bytes += 1;
      i += 2;
    } else if (c < 0x80) {
      bytes += 1;
    } else if (c < 0x800) {
      bytes += 2;
    } else if (c >= 0xd800 && c <= 0xdbff && i + 1 < len) {
      const next = body.charCodeAt(i + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        bytes += 4;
        i++;
      } else {
        bytes += 3;
      }
    } else {
      bytes += 3;
    }
  }
  return bytes;
};

// The URL parser removes every ASCII tab (U+0009), LF (U+000A) and CR (U+000D)
// from its input before anything else looks at it, so fetch never sees them —
// wherever they appear. `data:text/plain;<TAB>base64,TQ==` reaches the data: URL
// processor as `data:text/plain;base64,TQ==` and decodes as base64. Note this is
// narrower than ASCII whitespace: U+000C and U+0020 survive parsing, and the
// data: URL processor only tolerates U+0020 between `;` and `base64`.
const TAB_OR_NEWLINE = /[\t\n\r]/g;

/**
 * Estimate the percent-decoded payload size used by Fetch data: URLs.
 *
 * @param {string} url
 * @returns {number}
 */
export default function estimateDataURLDecodedBytes(url) {
  if (typeof url !== 'string') return 0;

  const parsed = url.replace(TAB_OR_NEWLINE, '');

  // Fetch removes URL fragments before processing a data: URL.
  const fragmentIndex = parsed.indexOf('#');

  return estimateDataURLBytes(
    fragmentIndex === -1 ? parsed : parsed.slice(0, fragmentIndex),
    estimatePercentDecodedBase64Bytes
  );
}

/**
 * Estimate the Buffer backing allocation used by Node's raw base64 decoder.
 *
 * @param {string} url
 * @returns {number}
 */
export function estimateDataURLBufferAllocation(url) {
  return estimateDataURLBytes(url, estimateBase64BufferAllocation);
}
