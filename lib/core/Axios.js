/**
 * Axios.js文件中定义了Axios实例上的request，get，post，delete方法。
 * get，post，delete等方法均是基于Axios.prototype.request的封装。
 * 在Axios.prototype.request中会依次执行请求拦截器，
 * dispatchRequest（实际发起），响应拦截器。
 * @type {{isArrayBuffer: function(Object): boolean, isBuffer: function(Object): boolean, isObject: function(Object): boolean, isFile: function(Object): boolean, isStandardBrowserEnv: function(): (boolean|*), isFunction: function(Object): boolean, isBlob: function(Object): boolean, forEach: function((Object|Array), Function): (undefined), isStream: function(Object): boolean, isArrayBufferView: function(Object): boolean, extend: function(Object, Object, Object): Object, isFormData: function(Object): boolean, trim: function(String): String, isNumber: function(Object): boolean, merge: function(): {}, isString: function(Object): boolean, isDate: function(Object): boolean, isURLSearchParams: function(Object): boolean, isArray: function(Object): boolean, isUndefined: function(Object): boolean, deepMerge: function(): {}}}
 */

'use strict';

var utils = require('./../utils');
var buildURL = require('../helpers/buildURL');
var InterceptorManager = require('./InterceptorManager');
var dispatchRequest = require('./dispatchRequest');
var mergeConfig = require('./mergeConfig');

/**
 * Create a new instance of Axios
 *
 * @param {Object} instanceConfig The default config for the instance
 */
function Axios (instanceConfig) {
    // Axios的配置
    this.defaults = instanceConfig;
    // 拦截器
    this.interceptors = {
        request: new InterceptorManager(), // 请求拦截器
        response: new InterceptorManager() // 响应拦截器
    };
}

/**
 * Dispatch a request：发出请求
 *
 * @param {Object} config The config specific for this request (merged with this.defaults)
 */
Axios.prototype.request = function request (config) {
    /*eslint no-param-reassign:0*/
    // Allow for axios('example/url'[, config]) a la fetch API
    // 如果config是一个字符串，把字符串当作请求的url地址
    if (typeof config === 'string') {
        config = arguments[1] || {};
        config.url = arguments[0];
    } else {
        config = config || {};
    }

    // 合并配置
    config = mergeConfig(this.defaults, config);

    // Set config.method
    // 如果没有指定请求方法，使用get方法
    if (config.method) {
        config.method = config.method.toLowerCase();
    } else if (this.defaults.method) {
        config.method = this.defaults.method.toLowerCase();
    } else {
        config.method = 'get';
    }

    // Hook up interceptors middleware
    // 将请求拦截器，和响应拦截器，以及实际的请求（dispatchRequest）的方法组合成数组，类似如下的结构
    // [请求拦截器1 success, 请求拦截器1 error, dispatchRequest, undefined, 响应拦截器1success, 响应拦截器1error]
    var chain = [dispatchRequest, undefined];
    var promise = Promise.resolve(config);

    this.interceptors.request.forEach(function unshiftRequestInterceptors (interceptor) {
        // unshift() 方法将一个或多个元素添加到数组的开头，并返回该数组的新长度(该方法修改原有数组)。
        chain.unshift(interceptor.fulfilled, interceptor.rejected);
    });

    this.interceptors.response.forEach(function pushResponseInterceptors (interceptor) {
        chain.push(interceptor.fulfilled, interceptor.rejected);
    });

    // 开始执行整个请求流程（请求拦截器->dispatchRequest->响应拦截器）
    while (chain.length) {
        // shift() 方法从数组中删除第一个元素，并返回该元素的值。此方法更改数组的长度。
        promise = promise.then(chain.shift(), chain.shift());
    }

    return promise;
};

Axios.prototype.getUri = function getUri (config) {
    config = mergeConfig(this.defaults, config);
    return buildURL(config.url, config.params, config.paramsSerializer).replace(/^\?/, '');
};

// Provide aliases for supported request methods
/**
 * 基于Axios.prototype.request封装其他方法
 * 将delete，get，head，options，post，put，patch添加到Axios.prototype的原型链上
 * Axios.prototype.delete =
 * Axios.prototype.get =
 * Axios.prototype.head =
 * Axios.prototype.options =
 * ...
 */
utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData (method) {
    /*eslint func-names:0*/
    Axios.prototype[method] = function (url, config) {
        return this.request(utils.merge(config || {}, {
            method: method,
            url: url
        }));
    };
});

utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData (method) {
    /*eslint func-names:0*/
    Axios.prototype[method] = function (url, data, config) {
        return this.request(utils.merge(config || {}, {
            method: method,
            url: url,
            data: data
        }));
    };
});

module.exports = Axios;
