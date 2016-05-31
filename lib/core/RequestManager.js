'use strict';

var utils = require('./../utils');

function RequestManager() {
  this.requests = [];
}

RequestManager.prototype.add = function add(requestId, request) {
  if (requestId) {
    request.requestId = requestId;
    this.requests.push(request);
  }
};

RequestManager.prototype.get = function get(requestId) {
  return this.requests.reduce(function reduceHandler(prev, curr) {
    return curr.requestId === requestId ? curr : prev;
  }, null);
};

RequestManager.prototype.remove = function remove(requestId) {
  var requestIndex = null;
  utils.forEach(this.requests, function forEachHandler(request, index) {
    if (request.requestId === requestId) {
      requestIndex = index;
    }
  });

  if (requestIndex !== null) {
    this.requests.splice(requestIndex, 1);
  }
};

RequestManager.prototype.abort = function abort(requestId) {
  var request = this.get(requestId);

  if (request && request.abort) {
    request.abort();
  }
  this.remove(requestId);
};

module.exports = RequestManager;
