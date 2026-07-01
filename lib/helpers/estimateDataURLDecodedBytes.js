/**
 * Estimate decoded byte length of a data:// URL *without* allocating large buffers.
 * - For base64: compute exact decoded size using length and padding;
 *               handle %XX at the character-count level (no string allocation).
 * - For non-base64: compute the exact percent-decoded UTF-8 byte length.
 *
 * @param {string} url
 * @returns {number}
 */
const isHexDigit = (charCode) =>
  (charCode >= 48 && charCode <= 57) ||
  (charCode >= 65 && charCode <= 70) ||
  (charCode >= 97 && charCode <= 102);

const isPercentEncodedByte = (str, i, len) =>
  i + 2 < len && isHexDigit(str.charCodeAt(i + 1)) && isHexDigit(str.charCodeAt(i + 2));

export default function estimateDataURLDecodedBytes(url) {
  if (!url || typeof url !== 'string') return 0;
  if (!url.startsWith('data:')) return 0;

  const comma = url.indexOf(',');
  if (comma < 0) return 0;

  const meta = url.slice(5, comma);
  const body = url.slice(comma + 1);
  const isBase64 = /;base64/i.test(meta);

  if (isBase64) {
    const len = body.length;

    // Mirror Node's Buffer.from(body, 'base64') decoder, which is what
    // fromDataURI feeds the *raw* (non-percent-decoded) body to: it ignores
    // every character outside the base64/base64url alphabet (including a bare
    // '%') and stops at the first '=' padding character. Node never
    // percent-decodes here, so a sequence such as `%3D` is NOT padding — the
    // '%' is dropped and `3`/`D` decode as ordinary base64 data. Counting the
    // significant alphabet characters is the only accounting that cannot
    // under-report the decoded size; the previous logic assumed `%XX` escapes
    // were consumed by percent-decoding and subtracted them, which let a body
    // like `%41` (kept by the decoder as `41`) bypass maxContentLength.
    const isBase64Char = (charCode) =>
      (charCode >= 65 && charCode <= 90) || // A-Z
      (charCode >= 97 && charCode <= 122) || // a-z
      (charCode >= 48 && charCode <= 57) || // 0-9
      charCode === 43 /* + */ ||
      charCode === 47 /* / */ ||
      charCode === 45 /* - (base64url) */ ||
      charCode === 95; /* _ (base64url) */

    let significant = 0;

    for (let i = 0; i < len; i++) {
      const code = body.charCodeAt(i);

      if (code === 61 /* '=' */) {
        break; // padding: decoding stops here
      }

      if (isBase64Char(code)) {
        significant++;
      }
    }

    const groups = Math.floor(significant / 4);
    const remainder = significant % 4;
    // A trailing group of 2 base64 chars decodes to 1 byte, 3 chars to 2 bytes,
    // 1 char is invalid and contributes nothing.
    const remainderBytes = remainder === 2 ? 1 : remainder === 3 ? 2 : 0;
    const bytes = groups * 3 + remainderBytes;
    return bytes > 0 ? bytes : 0;
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
}
