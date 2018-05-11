'use strict'
const axios = require('./axios')
const defaultInstance = axios.default

Object.assign(defaultInstance, axios)

delete defaultInstance.default

module.exports = defaultInstance
