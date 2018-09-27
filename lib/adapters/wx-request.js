'use strict';

module.exports = function wxAdapter(config) {
  return new Promise(function dispatchWxRequest(resolve, reject) {
    const data = config.data;
    const headers = config.headers;
    const request = wx.request;
    request({
      url: config.url,
      data: data,
      headers: headers,
      success: function(res) {
        resolve(res);
      },
      fail: function() {
        reject();
      }
    })
  });
}
