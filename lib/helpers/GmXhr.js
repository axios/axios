// allows using all Jquery AJAX methods in Greasemonkey
// https://gist.github.com/damoclark/f01b957797b7dd2c33d6
// https://gist.github.com/monperrus/999065
// inspired from
//   http://ryangreenberg.com/archives/2010/03/greasemonkey_jquery.php
// works with JQuery 1.5
// (c) 2016 Damien Clark
// (c) 2011 Martin Monperrus
// (c) 2010 Ryan Greenberg
//
// Example usage with JQuery:
//   $.ajax({
//     url: '/p/',
//     xhr: function(){return new GmXhr();},
//     type: 'POST',
//     success: function(val){
//        ....
//     }
//   });

'use strict';

/**
 * xmlHttpRequest API wrapper for GM_xmlhttpRequest
 *
 * @returns {GmXhr} An instance with a compatible API to xmlHttpRequest
 */
function GmXhr() {
  this.type = null;
  this.url = null;
  this.async = null;
  this.username = null;
  this.password = null;
  this.status = null;
  this.headers = {};
  this.readyState = null;
}

GmXhr.prototype.abort = function abort() {
  this.readyState = 0;
};

GmXhr.prototype.getAllResponseHeaders = function getAllResponseHeaders() {
  if (this.readyState !== 4) return '';
  return this.responseHeaders;
};

GmXhr.prototype.getResponseHeader = function getResponseHeader(name) {
  var regexp = new RegExp('^' + name + ': (.*)$', 'im');
  var match = regexp.exec(this.responseHeaders);
  if (match) { return match[1]; }
  return '';
};

GmXhr.prototype.open = function open(type, url, async, username, password) {
  this.type = type
    ? type
    : null;
  this.url = url
    ? url
    : null;
  this.async = async
    ? async
    : null;
  this.username = username
    ? username
    : null;
  this.password = password
    ? password
    : null;
  this.readyState = 1;
};

GmXhr.prototype.setRequestHeader = function setRequestHeader(name, value) {
  this.headers[name] = value;
};

GmXhr.prototype.send = function send(data) {
  this.data = data;
  var that = this;
  // http://wiki.greasespot.net/GM_xmlhttpRequest
  GM_xmlhttpRequest({
    method: this.type,
    url: this.url,
    headers: this.headers,
    data: this.data,
    onload: function onload(rsp) {
      // Populate wrapper object with returned data
      // including the Greasemonkey specific "responseHeaders"
      for (var k in rsp) {
        if (rsp.hasOwnProperty(k)) {
          that[k] = rsp[k];
        }
      }
      // now we call onreadystatechange
      if (that.hasOwnProperty('onreadystatechange')) {
        that.onreadystatechange();
      } else { // otherwise call onload
        that.onload();
      }
    },
    onerror: function onerror(rsp) {
      for (var k in rsp) {
        if (rsp.hasOwnProperty(k)) {
          that[k] = rsp[k];
        }
      }
      // now we call onreadystatechange
      if (that.hasOwnProperty('onreadystatechange')) {
        that.onreadystatechange();
      } else {
        that.onerror(); // otherwise call onerror
      }
    }
  });
};

module.exports = GmXhr;
