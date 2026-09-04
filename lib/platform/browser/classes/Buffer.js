'use strict';

// Browser counterpart of platform/node/classes/Buffer.js: a working fallback
// that never needs Node's Buffer global.
export default function toArrayBufferFallback(value) {
  return typeof Blob === 'function' ?
    new Blob([value]) :
    String.fromCharCode.apply(null, new Uint8Array(value));
}
