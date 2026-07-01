'use strict';

export default {
  isBufferAvailable() {
    return typeof Buffer !== 'undefined';
  },

  from(value) {
    return Buffer.from(value);
  }
};
