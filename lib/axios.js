'use strict';

var defaults = require('./defaults');
var utils = require('./utils');
var bind = require('./helpers/bind');
var Axios = require('./core/Axios');

var defaultInstance = new Axios(defaults);
var axios = module.exports = bind(Axios.prototype.request, defaultInstance);

// Copy Axios.prototype to axios instance
utils.extend(axios, Axios.prototype, defaultInstance);

// Copy defaultInstance to axios instance
utils.extend(axios, defaultInstance);

// Expose Axios class to allow class inheritance
axios.Axios = Axios;

// Factory for creating new instances
axios.create = function create(defaultConfig) {
  return new Axios(defaultConfig);
};

// Expose all/spread
axios.all = function all(promises) {
  return Promise.all(promises);
};
axios.spread = require('./helpers/spread');
