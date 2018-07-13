'use strict';

var utils = require('./../utils');
var settle = require('./../core/settle');
var buildURL = require('./../helpers/buildURL');
var parseHeaders = require('./../helpers/parseHeaders');
var isURLSameOrigin = require('./../helpers/isURLSameOrigin');
var createError = require('../core/createError');
var btoa = (typeof window !== 'undefined' && window.btoa && window.btoa.bind(window)) || require('./../helpers/btoa');

function setFetchTimeout(timeout) {
    return new Promise((resolve,reject) => {
        setTimeout(() => {
            reject(new Error("Timed out"));
        },timeout)
    });
}

module.exports = function fetchAdaptor(config) {
    var requestData = config.data;
    var requestHeaders = config.headers;

    if (utils.isFormData(requestData)) {
        delete requestHeaders['Content-Type']; // Let the browser set it
    }

    if (config.auth) {
        var username = config.auth.username || '';
        var password = config.auth.password || '';
        requestHeaders.Authorization = 'Basic ' + btoa(username + ':' + password);
    }

    var config = utils.merge({},{
        method: config.method.toUpperCase(),
        headers: config.headers,
        body: config.data
    });

    return Promise.race([setFetchTimeout,fetch(buildURL(config.url, config.params, config.paramsSerializer),fetchConfig)]);
};
