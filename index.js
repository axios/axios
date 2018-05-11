'use strict'
const axios = require('./dist/commonjs/axios')
const defaultInstance = axios.default

Object.assign(defaultInstance, axios)

delete defaultInstance.default

module.exports = defaultInstance
