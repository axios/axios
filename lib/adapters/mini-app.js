"use strict";

var settle = require("./../core/settle");
var buildURL = require("./../helpers/buildURL");
var createError = require("../core/createError");
var btoa =
  (typeof window !== "undefined" && window.btoa && window.btoa.bind(window)) ||
  require("./../helpers/btoa");

module.exports = function xhrAdapter(config) {
  return new Promise(function dispatchXhrRequest(resolve, reject) {
    var requestData = config.data;
    var requestHeaders = config.headers;
    var isWechat = typeof wx !== "undefined";
    var isAlipay = typeof my !== "undefined";
    var requestTask;
    var request = isWechat // wechat
      ? wx.request
      : isAlipay // alipay
        ? my.httpRequest
        : null;
    if (typeof request !== "function") {
      reject(createError("Not Support", config, null, {}));
    }
    var availableResponseType = isWechat ? ["text", "arraybuffer"] : [];

    // HTTP basic authentication
    if (config.auth) {
      var username = config.auth.username || "";
      var password = config.auth.password || "";
      requestHeaders.Authorization = "Basic " + btoa(username + ":" + password);
    }

    var requestConfig = {
      url: buildURL(config.url, config.params, config.paramsSerializer),
      method: config.method.toUpperCase(),
      header: requestHeaders,
      success: function(res) {
        var responseData = res.data;
        // wechat mini app use statusCode
        // alipay mini app use status
        var status = res.statusCode !== undefined ? res.statusCode : res.status;
        var responseHeaders = res.header;
        var response = {
          data: responseData,
          status: status,
          // no statusText, it you want, you can fill it by statusCode
          statusText: "",
          headers: responseHeaders,
          config: config,
          // in alipay, requestTask is undefined
          // so we set the requestTask to empty object to avoid throw an error
          request: requestTask || {}
        };
        settle(resolve, reject, response);
      },
      fail: function(error) {
        // in alipay, requestTask is undefined
        // so we set the requestTask to empty object to avoid throw an error
        reject(createError("Network Error", config, null, requestTask || {}));
      }
    };

    // only alipay support timeout
    if (isAlipay) {
      if (config.timeout) {
        requestConfig.timeout = config.timeout;
      }
    }

    // Check valid response type
    // only wechat support responseType
    if (isWechat && config.responseType) {
      if (config.responseType) {
        if (availableResponseType.indexOf(config.responseType) < 0) {
          reject(createError("Invalid response type", config, null, {}));
          return;
        }
        requestConfig.responseType = config.responseType;
      }
    }

    // send the request
    requestTask = request.call(wx, requestConfig);

    // only wechat support abort request
    if (isWechat && config.cancelToken) {
      // Handle cancellation
      config.cancelToken.promise.then(function onCanceled(cancel) {
        requestTask.abort();
        reject(cancel);
      });
    }
  });
};
