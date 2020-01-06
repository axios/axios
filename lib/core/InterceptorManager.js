'use strict';

/**
 * InterceptorManager.js文件中定义了axios拦截器类。
 * 包含了拦截器的添加，删除，循环拦截器。无论是响应拦截器还是请求拦截器，都是使用数组进行存储的。
 * @type {{isArrayBuffer: function(Object): boolean, isBuffer: function(Object): boolean, isObject: function(Object): boolean, isFile: function(Object): boolean, isStandardBrowserEnv: function(): (boolean|*), isFunction: function(Object): boolean, isBlob: function(Object): boolean, forEach: function((Object|Array), Function): (undefined), isStream: function(Object): boolean, isArrayBufferView: function(Object): boolean, extend: function(Object, Object, Object): Object, isFormData: function(Object): boolean, trim: function(String): String, isNumber: function(Object): boolean, merge: function(): {}, isString: function(Object): boolean, isDate: function(Object): boolean, isURLSearchParams: function(Object): boolean, isArray: function(Object): boolean, isUndefined: function(Object): boolean, deepMerge: function(): {}}}
 */
var utils = require('./../utils');

// 拦截器
function InterceptorManager () {
    // handlers数组用来存储拦截器
    this.handlers = [];
}

/**
 * Add a new interceptor to the stack
 *
 * @param {Function} fulfilled The function to handle `then` for a `Promise`
 * @param {Function} rejected The function to handle `reject` for a `Promise`
 *
 * @return {Number} An ID used to remove interceptor later
 */
// 添加拦截器，use方法接收两个参数，成功的回调以及失败的回调
InterceptorManager.prototype.use = function use (fulfilled, rejected) {
    this.handlers.push({
        // 成功的回调
        fulfilled: fulfilled,
        // 失败的回调
        rejected: rejected
    });
    return this.handlers.length - 1;
};

/**
 * Remove an interceptor from the stack
 *
 * @param {Number} id The ID that was returned by `use`
 */
// 根据id(索引)，删除实例handlers属性的拦截器
InterceptorManager.prototype.eject = function eject (id) {
    if (this.handlers[id]) {
        this.handlers[id] = null;
    }
};

/**
 * Iterate over all the registered interceptors
 *
 * This method is particularly useful for skipping over any
 * interceptors that may have become `null` calling `eject`.
 *
 * @param {Function} fn The function to call for each interceptor
 */
// 循环拦截器
InterceptorManager.prototype.forEach = function forEach (fn) {
    utils.forEach(this.handlers, function forEachHandler (h) {
        if (h !== null) {
            fn(h);
        }
    });
};

module.exports = InterceptorManager;
