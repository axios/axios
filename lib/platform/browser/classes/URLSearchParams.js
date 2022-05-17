'use strict';

module.exports = typeof URLSearchParams !== 'undefined' ? URLSearchParams : (function defineURLSearchParams() {
  function encode(str) {
    var charMap = {
      '!': '%21',
      "'": '%27',
      '(': '%28',
      ')': '%29',
      '~': '%7E',
      '%20': '+',
      '%00': '\x00'
    };
    return encodeURIComponent(str).replace(/[!'\(\)~]|%20|%00/g, function replacer(match) {
      return charMap[match];
    });
  }

  function URLSearchParams() {
    this.pairs = [];
  }

  var prototype = URLSearchParams.prototype;

  prototype.append = function append(name, value) {
    this.pairs.push([name, value]);
  };

  prototype.toString = function toString() {
    return this.pairs.map(function each(pair) {
      return pair[0] + '=' + encode(pair[1]);
    }, '').join('&');
  };

  return URLSearchParams;
})();
