'use strict';

var utils = require('./utils');
var bind = require('./helpers/bind');
var Axios = require('./core/Axios');
var mergeConfig = require('./core/mergeConfig');
var defaults = require('./defaults');

/**
 * Create an instance of Axios ：创建一个Axios实例
 *
 * @param {Object} defaultConfig The default config for the instance
 * @return {function(): *} A new instance of Axios
 */
function createInstance (defaultConfig) {
    var context = new Axios(defaultConfig);
    
    var instance = bind(Axios.prototype.request, context);
    
    // Copy axios.prototype to instance：复制Axios.prototype到实例
    utils.extend(instance, Axios.prototype, context);
    
    // Copy context to instance：：复制context到实例
    utils.extend(instance, context, null);
    
    // 返回实例对象
    return instance;
}

// Create the default instance to be exported：创建默认实例
var axios = createInstance(defaults);

// Expose Axios class to allow class inheritance： 公开Axios对象以允许继承
axios.Axios = Axios;

// Factory for creating new instances ：创建新实例工厂方法
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
