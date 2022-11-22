import {Readable} from 'stream';
import utils from "../utils.js";

const BOUNDARY_ALPHABET = utils.ALPHABET.ALPHA_DIGIT + '-_';

const textEncoder = new TextEncoder();

const CRLF = '\r\n';
const CRLF_BYTES = textEncoder.encode(CRLF);
const CRLF_BYTES_COUNT = 2;

class FormDataPart {
  constructor(name, value) {
    const {escapeName} = this.constructor;
    const type = this.type = utils.kindOf(value);
    const isFile = type === 'file';

    this.name = name;

    this.value = value;

    if (type !== 'blob' && !isFile) {
      value = textEncoder.encode(String(value).replace(/\r?\n|\r\n?/g, CRLF));
    } else {
      this.isBlob = true;
    }

    const filename = isFile ? `; filename="${escapeName(value.name)}"` : '';

    let headers = `Content-Disposition: form-data; name="${escapeName(name)}"${filename}${CRLF}`;

    if (isFile) {
      headers += `Content-Type: ${value.type || "application/octet-stream"}${CRLF}`
    }

    this.headers = textEncoder.encode(headers + CRLF);

    this.contentLength = this.isBlob ? value.size : value.byteLength;

    this.size = this.headers.byteLength + this.contentLength + CRLF_BYTES_COUNT;
  }

  *encode(){
    yield this.headers;

    yield this.value;

    yield CRLF_BYTES;
  }

  static escapeName(name) {
      return String(name).replace(/[\r\n"]/g, (match) => ({
        '\r' : '%0D',
        '\n' : '%0A',
        '"' : '%22',
      }[match]));
  }
}

const formDataToStream = (form, headersHandler, options) => {
  const {
    tag = 'form-data-boundary',
    size = 25,
    boundary = tag + '-' + utils.generateString(size, BOUNDARY_ALPHABET)
  } = options || {};

  if(!utils.isFormData(form)) {
    throw TypeError('FormData instance required');
  }

  if (boundary.length < 1 || boundary.length > 70) {
    throw Error('boundary must be 10-70 characters long')
  }

  const boundaryBytes = textEncoder.encode('--' + boundary + CRLF);
  const footerBytes = textEncoder.encode('--' + boundary + '--' + CRLF + CRLF);
  let contentLength = footerBytes.byteLength;

  const parts = Array.from(form.entries()).map(([name, value]) => {
    const part = new FormDataPart(name, value);
    contentLength += part.size;
    return part;
  });

  contentLength += boundaryBytes.byteLength * parts.length;

  headersHandler && headersHandler({
    'Content-Length': contentLength,
    'Content-Type': `multipart/form-data; boundary=${boundary}`
  });

  return Readable.from((async function *() {
    for(const part of parts) {
      yield boundaryBytes;
      yield* part.encode();
    }

    yield footerBytes;
  })());
};

export default formDataToStream;
