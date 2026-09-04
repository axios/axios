'use strict';

// Isolated in its own module (like platform/node/classes/FormData.js) so
// bundlers targeting the browser, which remap this path via package.json's
// "browser" field, never see a direct reference to the `Buffer` global.
export default function toArrayBufferFallback(value) {
  return Buffer.from(value);
}
