'use strict';

/**
 * axios默认配置
 * defaults.js文件中配置了，axios默认的请求头、不同的环境下axios默认使用的请求方法、格式化请求正文的方法，格式化响应正文方法等内容
 * @type {{isArrayBuffer: function(Object): boolean, isBuffer: function(Object): boolean, isObject: function(Object): boolean, isFile: function(Object): boolean, isStandardBrowserEnv: function(): (boolean|*), isFunction: function(Object): boolean, isBlob: function(Object): boolean, forEach: function((Object|Array), Function): (undefined), isStream: function(Object): boolean, isArrayBufferView: function(Object): boolean, extend: function(Object, Object, Object): Object, isFormData: function(Object): boolean, trim: function(String): String, isNumber: function(Object): boolean, merge: function(): {}, isString: function(Object): boolean, isDate: function(Object): boolean, isURLSearchParams: function(Object): boolean, isArray: function(Object): boolean, isUndefined: function(Object): boolean, deepMerge: function(): {}}}
 */
var utils = require('./utils');

// 规范化头部名称（全部转化为大写）
var normalizeHeaderName = require('./helpers/normalizeHeaderName');

// 默认Content-Type
var DEFAULT_CONTENT_TYPE = {
    'Content-Type': 'application/x-www-form-urlencoded'
};

// 设置ContentType，在没有设置的情况下
function setContentTypeIfUnset (headers, value) {
    if (!utils.isUndefined(headers) && utils.isUndefined(headers['Content-Type'])) {
        headers['Content-Type'] = value;
    }
}

/**
 * 获取默认适配器, 根据当前环境，获取默认的请求方法
 * @returns {function(*=): Promise<unknown>}
 */
function getDefaultAdapter () {
    var adapter;
    if (typeof XMLHttpRequest !== 'undefined') {
        // For browsers use XHR adapter： 对于浏览器，使用xhr适配器
        // 浏览器环境
        adapter = require('./adapters/xhr');
        // 判断当前环境是否存在process对象
    } else if (typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]') {
        // For node use HTTP adapter： 对于node，使用http适配器
        // node环境
        adapter = require('./adapters/http');
    }
    return adapter;
}

/**
 * 默认配置对象
 * @type {{maxContentLength: number, adapter: (function(*=): Promise<unknown>), validateStatus: (function(*): boolean|boolean), transformRequest: [function(*=, *=): (*)], xsrfHeaderName: string, transformResponse: [function(*=): any], timeout: number, xsrfCookieName: string}}
 */
var defaults = {
    // 默认的获取环境
    adapter: getDefaultAdapter(),
    
    // 格式化请求requestData，这会请求发送前使用
    transformRequest: [function transformRequest (data, headers) {
        // 格式化header属性名，将header中不标准的属性名，格式化为Accept属性名
        normalizeHeaderName(headers, 'Accept');
        // 格式化header属性名，将header中不标准的属性名，格式化为Content-Type属性名
        normalizeHeaderName(headers, 'Content-Type');
        if (utils.isFormData(data) || utils.isArrayBuffer(data) || utils.isBuffer(data) || utils.isStream(data) || utils.isFile(data) || utils.isBlob(data)) {
            return data;
        }
        if (utils.isArrayBufferView(data)) {
            return data.buffer;
        }
        /**
         * URLSearchParams提供了一些用来处理URL查询字符串接口
         * 如果是URLSearchParams对象
         */
        if (utils.isURLSearchParams(data)) {
            // Content-Type设置为application/x-www-form-urlencoded，application/x-www-form-urlencoded，数据被编码成以&分隔的键值对
            setContentTypeIfUnset(headers, 'application/x-www-form-urlencoded;charset=utf-8');
            return data.toString();
        }
        // 如果是对象
        if (utils.isObject(data)) {
            // Content-Type设置为application/json
            setContentTypeIfUnset(headers, 'application/json;charset=utf-8');
            // 将请求正文格式化为JSON字符串，并返回
            return JSON.stringify(data);
        }
        return data;
    }],
    
    // 格式化响应responseData，这会响应接受后使用
    transformResponse: [function transformResponse (data) {
        /*eslint no-param-reassign:0*/
        if (typeof data === 'string') {
            try {
                data = JSON.parse(data);
            } catch (e) { /* Ignore */
            }
        }
        return data;
    }],
    
    /**
     * A timeout in milliseconds to abort a request. If set to 0 (default) a
     * timeout is not created.
     */
    // 默认超时时间(毫秒值)
    timeout: 0,
    
    // xsrf设置的cookie的key
    xsrfCookieName: 'XSRF-TOKEN',
    // xsrf设置的header的key
    xsrfHeaderName: 'X-XSRF-TOKEN',
    
    maxContentLength: -1,
    
    // 验证请求状态
    validateStatus: function validateStatus (status) {
        return status >= 200 && status < 300;
    }
};

defaults.headers = {
    // 通用的HTTP字段，Accept告知客户端可以处理的类型
    common: {
        'Accept': 'application/json, text/plain, */*'
    }
};

utils.forEach(['delete', 'get', 'head'], function forEachMethodNoData (method) {
    defaults.headers[method] = {};
});

// 为post，put，patch请求设置默认的Content-Type
utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData (method) {
    defaults.headers[method] = utils.merge(DEFAULT_CONTENT_TYPE);
});

module.exports = defaults;
