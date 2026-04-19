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

describe('formDataToStream (GHSA-445q-vr5w-6q77 CRLF injection)', () => {
  it('should strip CRLF sequences from blob.type to prevent multipart header injection', async () => {
    const fd = new SpecFormData();
    fd.append('photo', makeBlobLike({
      type: 'image/jpeg\r\nX-Injected-Header: PWNED\r\nX-Evil: bad',
      name: 'photo.jpg',
      payload: Buffer.from('PAYLOAD'),
    }));

    const body = await collect(formDataToStream(fd, () => {}));

    expect(body).not.toContain('\r\nX-Injected-Header');
    expect(body).not.toContain('\r\nX-Evil');
    expect(body).toContain('Content-Type: image/jpegX-Injected-Header: PWNEDX-Evil: bad\r\n');
  });

  it('should strip bare \\r and bare \\n from blob.type', async () => {
    const fd = new SpecFormData();
    fd.append('f', makeBlobLike({
      type: 'text/plain\rX-A: 1\nX-B: 2',
      name: 'f.txt',
      payload: Buffer.from('x'),
    }));

    const body = await collect(formDataToStream(fd, () => {}));

    expect(body).not.toMatch(/^X-A:/m);
    expect(body).not.toMatch(/^X-B:/m);
  });

  it('should preserve legitimate Content-Type values', async () => {
    const fd = new SpecFormData();
    fd.append('doc', makeBlobLike({
      type: 'application/json; charset=utf-8',
      name: 'doc.json',
      payload: Buffer.from('{}'),
    }));

    const body = await collect(formDataToStream(fd, () => {}));

    expect(body).toContain('Content-Type: application/json; charset=utf-8\r\n');
  });

  it('should default missing blob.type to application/octet-stream', async () => {
    const fd = new SpecFormData();
    fd.append('bin', makeBlobLike({
      type: '',
      name: 'bin',
      payload: Buffer.from([0x00, 0x01]),
    }));

    const body = await collect(formDataToStream(fd, () => {}));

    expect(body).toContain('Content-Type: application/octet-stream\r\n');
  });

  it('should escape CRLF and quotes in blob.name (Content-Disposition)', async () => {
    const fd = new SpecFormData();
    fd.append('up', makeBlobLike({
      type: 'text/plain',
      name: 'evil\r\nX-Bad: 1".jpg',
      payload: Buffer.from('x'),
    }));

    const body = await collect(formDataToStream(fd, () => {}));

    expect(body).not.toContain('\r\nX-Bad: 1');
    expect(body).toContain('filename="evil%0D%0AX-Bad: 1%22.jpg"');
  });

  it('should report stable contentLength that matches emitted bytes', async () => {
    const fd = new SpecFormData();
    fd.append('photo', makeBlobLike({
      type: 'image/jpeg\r\nX-Injected: PWNED',
      name: 'photo.jpg',
      payload: Buffer.from('PAYLOAD'),
    }));

    let reportedLength;
    const stream = formDataToStream(fd, (h) => {
      reportedLength = h['Content-Length'];
    }, { boundary: 'test-boundary-abc' });

    const body = await collect(stream);

    expect(Buffer.byteLength(body, 'utf8')).toBe(reportedLength);
  });
});
