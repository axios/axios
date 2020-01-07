/**
 * axios.js文件是axios工具库的入口方法
 * @type {{isArrayBuffer: function(Object): boolean, isBuffer: function(Object): boolean, isObject: function(Object): boolean, isFile: function(Object): boolean, isStandardBrowserEnv: function(): (boolean|*), isFunction: function(Object): boolean, isBlob: function(Object): boolean, forEach: function((Object|Array), Function): (undefined), isStream: function(Object): boolean, isArrayBufferView: function(Object): boolean, extend: function(Object, Object, Object): Object, isFormData: function(Object): boolean, trim: function(String): String, isNumber: function(Object): boolean, merge: function(): {}, isString: function(Object): boolean, isDate: function(Object): boolean, isURLSearchParams: function(Object): boolean, isArray: function(Object): boolean, isUndefined: function(Object): boolean, deepMerge: function(): {}}}
 */

'use strict';

var utils = require('./utils');
var bind = require('./helpers/bind');
var Axios = require('./core/Axios');
var mergeConfig = require('./core/mergeConfig');
var defaults = require('./defaults');

/**
 * Create an instance of Axios
 * @param {Object} defaultConfig The default config for the instance
 * @return {function(): *} A new instance of Axios
 */
function createInstance (defaultConfig) {
    // 生成Axios实例
    var context = new Axios(defaultConfig);
    
    // 更改Axios.prototype.request的this，指向context实例
    // instance等于Axios.prototype.request方法
    var instance = bind(Axios.prototype.request, context);
    
    // Copy axios.prototype to instance
    /**
     * 将Axios.prototype，context上的属性合并到instance
     * instance.get = Axios.prototype.get
     * instance.defaults = context.defaults
     */
    utils.extend(instance, Axios.prototype, context);
    
    // Copy context to instance
    utils.extend(instance, context, null);
    
    // 返回实例对象
    return instance;
}

// Create the default instance to be exported
/**
 * axios会直接对使用者暴露一个axios.request的方法，所以我们在使用axios的时候可以这样使用。
 * import axios from 'axios'
 * axios.get('/info')
 * 不需要new一个axios的实例
 * @type {function(): *}
 */
var axios = createInstance(defaults);

// Expose Axios class to allow class inheritance
// 公开Axios对象以允许继承
axios.Axios = Axios;

// Factory for creating new instances
// axios.create可以根据用户自定义的config生成一个新的axios实例
axios.create = function create (instanceConfig) {
    return createInstance(mergeConfig(axios.defaults, instanceConfig));
};

// Expose Cancel & CancelToken
axios.Cancel = require('./cancel/Cancel');
axios.CancelToken = require('./cancel/CancelToken');
axios.isCancel = require('./cancel/isCancel');

// Expose all/spread
axios.all = function all (promises) {
    return Promise.all(promises);
};
axios.spread = require('./helpers/spread');

module.exports = axios;

// Allow use of default import syntax in TypeScript
module.exports.default = axios;
