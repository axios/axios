'use strict';

module.exports = function parseJSON(data) {
  /*eslint no-param-reassign:0*/
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch (e) { /* Ignore */ }
  }
  return data;
};
