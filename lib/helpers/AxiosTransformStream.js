'use strict';

var stream = require('stream');
var utils = require('../utils');
var throttle = require('./throttle');
var speedometer = require('./speedometer');

var kInternals = Symbol('internals');


function AxiosTransformStream(options) {
  var self = this;

  options = utils.toFlatObject(options, {
    maxRate: 0,
    chunkSize: 64 * 1024,
    timeWindow: 250,
    ticksRate: 1
  }, null, function(prop, source) {
    return !utils.isUndefined(source[prop]);
  });

  stream.Transform.call(this, {
    readableHighWaterMark: options.chunkSize
  });

  var internals = this[kInternals] = Object.assign({
    length: options.length,
    timeWindow: options.timeWindow,
    ticksRate: options.ticksRate,
    chunkSize: options.chunkSize,
    maxRate: options.maxRate,
    bytesSeen: 0,
    isCaptured: false,
    notifiedBytesLoaded: 0,
    ts: Date.now(),
    bytes: 0,
    samplesCount: 100,
    rate: undefined,
    rate_bytes: 0,
    rate_ts: 0
  }, options || null);

  internals.speedometer = speedometer(internals.samplesCount, internals.timeWindow);

  this.on('newListener', function(event) {
    if (event === 'progress') {
      if (!internals.isCaptured) {
        internals.isCaptured = true;
      }
    }
  });

  var bytesNotified = 0;

  internals.updateProgress = throttle(function throttledHandler() {
    var totalBytes = internals.length;
    var bytesTransferred = internals.bytesSeen;
    var progressBytes = bytesTransferred - bytesNotified;
    var rate = internals.rate;
    var inRange = bytesTransferred <= totalBytes;

    if (!progressBytes || self.destroyed) return;

    bytesNotified = bytesTransferred;

    self.emit('progress', {
      'loaded': bytesTransferred,
      'total': totalBytes,
      'progress': totalBytes ? (bytesTransferred / totalBytes) : undefined,
      'bytes': progressBytes,
      'rate': rate ? rate : undefined,
      'estimated': rate && totalBytes && inRange ? (totalBytes - bytesTransferred) / rate : undefined
    });
  }, internals.ticksRate);

  var onFinish = function() {
    internals.updateProgress(true);
  };

  this.once('end', onFinish);
  this.once('error', onFinish);
}

utils.inherits(AxiosTransformStream, stream.Transform, {
  _transform: function(chunk, encoding, callback) {
    var self = this;
    var internals = this[kInternals];
    var maxRate = internals.maxRate;
    var fullSize = Buffer.byteLength(chunk);
    var chunkSize = this.readableHighWaterMark;
    var chunkRemainder = null;
    var timeWindow = internals.timeWindow;
    var now = Date.now();
    var ts = internals.ts || now;
    var passed = now - ts;
    var bytesTransferred = internals.bytes;
    var divider = 1000 / timeWindow;
    var bytesThreshold = (maxRate / divider);
    var bytesLeft = bytesThreshold - bytesTransferred;

    function scheduleTransform(_chunk, _encoding, _callback) {
      var sleep = timeWindow - passed;

      setTimeout(function() {
        internals.ts = Date.now();
        bytesLeft = maxRate - internals.bytes;
        internals.bytes = bytesLeft < 0 ? -bytesLeft : 0;

        self._transform(_chunk, _encoding, _callback);
      }, sleep);
    }

    function pushChunk(_chunk, _callback) {
      var bytes = Buffer.byteLength(_chunk);
      internals.bytesSeen += bytes;
      internals.bytes += bytes;

      var _now = Date.now();

      if (internals.isCaptured) {
        internals.rate_bytes += bytes;

        if (_now - internals.rate_ts >= 100) {
          internals.rate_ts = _now;
          internals.rate = internals.speedometer(internals.rate_bytes);
          internals.rate_bytes = 0;
        }

        internals.updateProgress();
      }

      if (self.push(_chunk)) {
        _callback(null);
      } else {
        self.pause();
        self.once('resume', function() {
          _callback(null);
        });
      }
    }

    if (!maxRate) {
      if (fullSize > chunkSize) {
        chunkRemainder = chunk.subarray(chunkSize);
        chunk = chunk.subarray(0, chunkSize);
        pushChunk(chunk, function() {
          self._transform(chunkRemainder, encoding, callback);
        });
      } else {
        pushChunk(chunk, callback);
      }

      return;
    }

    if (passed >= timeWindow) {
      internals.ts = now;
      internals.bytes = 0;
    }

    var oversizeFactor = fullSize / bytesLeft;

    if (bytesLeft <= 0) {
      scheduleTransform(chunk, encoding, callback);
    } else {
      if (oversizeFactor > 1.05) {
        chunkRemainder = chunk.subarray(bytesLeft);
        chunk = chunk.subarray(0, bytesLeft);
        pushChunk(chunk, function() {
          scheduleTransform(chunkRemainder, encoding, callback);
        });
      } else {
        pushChunk(chunk, callback);
      }
    }
  },

  setLength: function(length) {
    this[kInternals].length = +length;
    return this;
  }
});

module.exports = AxiosTransformStream;
