import { describe, it, expect } from 'vitest';
import formDataToStream from '../../../lib/helpers/formDataToStream.js';

class SpecFormData {
  constructor() {
    this._entries = [];
    this[Symbol.toStringTag] = 'FormData';
  }
  append(name, value) {
    this._entries.push([name, value]);
  }
  entries() {
    return this._entries[Symbol.iterator]();
  }
  [Symbol.iterator]() {
    return this._entries[Symbol.iterator]();
  }
}

const makeBlobLike = ({ type, name, size, payload }) => ({
  type,
  name,
  size: size ?? payload.byteLength,
  [Symbol.asyncIterator]: async function* () {
    yield payload;
  },
});

const collect = async (stream) => {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf8');
};

describe('formDataToStream', () => {
  it('should strip CRLF sequences from blob.type to prevent multipart header injection', async () => {
    const fd = new SpecFormData();
    fd.append(
      'photo',
      makeBlobLike({
        type: 'image/jpeg\r\nX-Injected-Header: PWNED\r\nX-Evil: bad',
        name: 'photo.jpg',
        payload: Buffer.from('PAYLOAD'),
      })
    );

    const body = await collect(formDataToStream(fd, () => {}));

    expect(body).not.toContain('\r\nX-Injected-Header');
    expect(body).not.toContain('\r\nX-Evil');
    expect(body).toContain('Content-Type: image/jpegX-Injected-Header: PWNEDX-Evil: bad\r\n');
  });

  it('should strip bare \\r and bare \\n from blob.type', async () => {
    const fd = new SpecFormData();
    fd.append(
      'f',
      makeBlobLike({
        type: 'text/plain\rX-A: 1\nX-B: 2',
        name: 'f.txt',
        payload: Buffer.from('x'),
      })
    );

    const body = await collect(formDataToStream(fd, () => {}));

    expect(body).not.toMatch(/^X-A:/m);
    expect(body).not.toMatch(/^X-B:/m);
  });

  it('should preserve legitimate Content-Type values', async () => {
    const fd = new SpecFormData();
    fd.append(
      'doc',
      makeBlobLike({
        type: 'application/json; charset=utf-8',
        name: 'doc.json',
        payload: Buffer.from('{}'),
      })
    );

    const body = await collect(formDataToStream(fd, () => {}));

    expect(body).toContain('Content-Type: application/json; charset=utf-8\r\n');
  });

  it('should default missing blob.type to application/octet-stream', async () => {
    const fd = new SpecFormData();
    fd.append(
      'bin',
      makeBlobLike({
        type: '',
        name: 'bin',
        payload: Buffer.from([0x00, 0x01]),
      })
    );

    const body = await collect(formDataToStream(fd, () => {}));

    expect(body).toContain('Content-Type: application/octet-stream\r\n');
  });

  it('should escape CRLF and quotes in blob.name (Content-Disposition)', async () => {
    const fd = new SpecFormData();
    fd.append(
      'up',
      makeBlobLike({
        type: 'text/plain',
        name: 'evil\r\nX-Bad: 1".jpg',
        payload: Buffer.from('x'),
      })
    );

    const body = await collect(formDataToStream(fd, () => {}));

    expect(body).not.toContain('\r\nX-Bad: 1');
    expect(body).toContain('filename="evil%0D%0AX-Bad: 1%22.jpg"');
  });

  it('should report stable contentLength that matches emitted bytes', async () => {
    const fd = new SpecFormData();
    fd.append(
      'photo',
      makeBlobLike({
        type: 'image/jpeg\r\nX-Injected: PWNED',
        name: 'photo.jpg',
        payload: Buffer.from('PAYLOAD'),
      })
    );

    let reportedLength;
    const stream = formDataToStream(
      fd,
      (h) => {
        reportedLength = h['Content-Length'];
      },
      { boundary: 'test-boundary-abc' }
    );

    const body = await collect(stream);

    expect(Buffer.byteLength(body, 'utf8')).toBe(reportedLength);
  });

  it('should keep an empty blob name as an empty filename parameter', async () => {
    const fd = new SpecFormData();
    fd.append(
      'upload',
      makeBlobLike({
        type: 'application/octet-stream',
        name: '',
        payload: Buffer.from([0xff, 0x00]),
      })
    );

    const body = await collect(formDataToStream(fd, () => {}));

    // A part without filename is parsed as a text field, corrupting binary data.
    expect(body).toContain('Content-Disposition: form-data; name="upload"; filename=""');
  });

  it('should default a missing blob name to "blob", matching formDataToBlob', async () => {
    const fd = new SpecFormData();
    fd.append(
      'upload',
      makeBlobLike({
        type: 'application/octet-stream',
        name: undefined,
        payload: Buffer.from('x'),
      })
    );

    const body = await collect(formDataToStream(fd, () => {}));

    expect(body).toContain('filename="blob"');
  });

  // Real File/Blob objects, matching what browsers send (reviewer suggestion).
  it.runIf(typeof File === 'function')(
    'should emit the same filenames for real File and Blob objects',
    async () => {
      const fd = new SpecFormData();
      fd.append(
        'empty',
        new File([new Uint8Array([0xff, 0x00])], '', { type: 'application/octet-stream' })
      );
      fd.append('nameless', new Blob([new Uint8Array([0x01])], { type: 'application/octet-stream' }));

      const body = await collect(formDataToStream(fd, () => {}));

      expect(body).toContain('Content-Disposition: form-data; name="empty"; filename=""');
      expect(body).toContain('Content-Disposition: form-data; name="nameless"; filename="blob"');
      expect(body).toContain(Buffer.from([0xff, 0x00]).toString('utf8'));
    }
  );
});
