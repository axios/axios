/**
 * dispatchRequest.js文件是axios源码中实际调用请求的地方。
 * @type {{isArrayBuffer: function(Object): boolean, isBuffer: function(Object): boolean, isObject: function(Object): boolean, isFile: function(Object): boolean, isStandardBrowserEnv: function(): (boolean|*), isFunction: function(Object): boolean, isBlob: function(Object): boolean, forEach: function((Object|Array), Function): (undefined), isStream: function(Object): boolean, isArrayBufferView: function(Object): boolean, extend: function(Object, Object, Object): Object, isFormData: function(Object): boolean, trim: function(String): String, isNumber: function(Object): boolean, merge: function(): {}, isString: function(Object): boolean, isDate: function(Object): boolean, isURLSearchParams: function(Object): boolean, isArray: function(Object): boolean, isUndefined: function(Object): boolean, deepMerge: function(): {}}}
 */

'use strict';

var utils = require('./../utils');
var transformData = require('./transformData');
var isCancel = require('../cancel/isCancel');
var defaults = require('../defaults');

/**
 * Throws a `Cancel` if cancellation has been requested.
 * 判断请求是否已被取消，如果已经被取消，抛出已取消
 */
function throwIfCancellationRequested (config) {
    if (config.cancelToken) {
        config.cancelToken.throwIfRequested();
    }
}

/**
 * Dispatch a request to the server using the configured adapter.
 *
 * @param {object} config The config that is to be used for the request
 * @returns {Promise} The Promise to be fulfilled
 */
module.exports = function dispatchRequest (config) {
    throwIfCancellationRequested(config);
    
    // Ensure headers exist
    config.headers = config.headers || {};
    
    // Transform request data
    /**
     * 使用/lib/defaults.js中的transformRequest方法，对config.headers和config.data进行格式化
     * 比如将headers中的Accept，Content-Type统一处理成大写
     * 比如如果请求正文是一个Object会格式化为JSON字符串，并添加application/json;charset=utf-8的Content-Type
     * 等一系列操作
     * @type {*}
     */
    config.data = transformData(
        config.data,
        config.headers,
        config.transformRequest
    );
    
    // Flatten headers
    // 合并不同配置的headers，config.headers的配置优先级更高
    config.headers = utils.merge(
        config.headers.common || {},
        config.headers[config.method] || {},
        config.headers || {}
    );
    
    // 删除headers中的method属性
    utils.forEach(
        ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
        function cleanHeaderConfig (method) {
            delete config.headers[method];
        }
    );
    
    //  如果config配置了adapter，使用config中配置adapter的替代默认的请求方法
    var adapter = config.adapter || defaults.adapter;
    
    // 使用adapter方法发起请求（adapter根据浏览器环境或者Node环境会有不同）
    return adapter(config).then(
        //请求正确返回的回调
        function onAdapterResolution (response) {
            //判断是否以及取消了请求，如果取消了请求抛出以取消
            throwIfCancellationRequested(config);
            
            // Transform response data
            response.data = transformData(
                response.data,
                response.headers,
                config.transformResponse
            );
            
            return response;
        },
        // 请求失败的回调
        function onAdapterRejection (reason) {
            if (!isCancel(reason)) {
                throwIfCancellationRequested(config);
                
                // Transform response data
                if (reason && reason.response) {
                    reason.response.data = transformData(
                        reason.response.data,
                        reason.response.headers,
                        config.transformResponse
                    );
                }
            }
            
            return Promise.reject(reason);
        });
};
