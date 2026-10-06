import utils from '../utils.js';

const CRLF = '\r\n';
const normalizeLines = (value) => String(value).replace(/\r\n|\r|\n/g, CRLF);
const escapeName = (value) =>
  String(value).replace(/[\r\n"]/g, (char) =>
    char === '\r' ? '%0D' : char === '\n' ? '%0A' : '%22'
  );

// Count UTF-8 bytes without allocating an encoded copy of a field. FormData
// string values normalize line endings; Blob/File contents remain unchanged.
const stringBytes = (value, normalize) => {
  let length = 0;
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (normalize && (code === 13 || code === 10)) {
      if (code === 13 && value.charCodeAt(i + 1) === 10) i++;
      length += 2;
    } else if (code < 0x80) {
      length++;
    } else if (code < 0x800) {
      length += 2;
    } else if (
      code >= 0xd800 &&
      code <= 0xdbff &&
      value.charCodeAt(i + 1) >= 0xdc00 &&
      value.charCodeAt(i + 1) <= 0xdfff
    ) {
      length += 4;
      i++;
    } else {
      length += 3;
    }
  }
  return length;
};

// Describe serialization failures independently of any request library.
export class FormDataError extends TypeError {
  constructor(message, reason) {
    super(message);
    this.name = 'FormDataError';
    this.reason = reason;
  }
}

// The caller supplies the boundary, Blob implementation, and limit error.
export default function formDataToBlob(form, Blob, limit, limitError, boundary) {
  if (!utils.isFunction(Blob)) {
    throw new FormDataError('Blob is not supported', 'blob');
  }

  if (
    !utils.isString(boundary) ||
    !/^[A-Za-z0-9'()+_,./:=? -]{1,70}$/.test(boundary) ||
    / $/.test(boundary)
  ) {
    throw new FormDataError('Invalid multipart boundary', 'boundary');
  }
  const footer = '--' + boundary + '--' + CRLF;
  let length = footer.length;
  const parts = [];
  const checkLength = (extra) => {
    if (length + extra > limit) throw limitError();
  };
  checkLength(0);

  for (const [name, value] of form) {
    const isString = utils.isString(value);
    const valueLength = isString ? stringBytes(value, true) : value.size;
    if (!Number.isFinite(valueLength) || valueLength < 0) {
      throw new FormDataError('Unsupported FormData part size', 'part');
    }
    // Reject large values and names before building normalized header strings.
    checkLength(
      valueLength +
        stringBytes(name, true) +
        (!isString && value.name ? stringBytes(value.name, false) : 0) +
        (!isString && value.type ? stringBytes(value.type, false) : 0)
    );

    let header =
      '--' +
      boundary +
      CRLF +
      'Content-Disposition: form-data; name="' +
      escapeName(normalizeLines(name)) +
      '"';
    if (!isString) {
      header +=
        '; filename="' +
        escapeName(utils.isString(value.name) ? value.name : 'blob') +
        '"' +
        CRLF +
        'Content-Type: ' +
        String(value.type || 'application/octet-stream').replace(/[\r\n]/g, '');
    }
    header += CRLF + CRLF;
    const partLength = stringBytes(header, false) + valueLength + CRLF.length;
    checkLength(partLength);
    length += partLength;
    parts.push({ header, value, isString });
  }

  // Native Blob composition retains existing Blob/File data. No file is read
  // and no complete multipart ArrayBuffer is created to determine its length.
  const blobParts = [];
  for (const part of parts) {
    blobParts.push(part.header, part.isString ? normalizeLines(part.value) : part.value, CRLF);
  }
  blobParts.push(footer);
  return new Blob(blobParts, { type: 'multipart/form-data; boundary=' + boundary });
}
