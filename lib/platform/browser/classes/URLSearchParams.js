'use strict';

var AxiosURLSearchParams = require('../../../helpers/AxiosURLSearchParams');

module.exports = typeof URLSearchParams !== 'undefined' ? URLSearchParams : AxiosURLSearchParams;
