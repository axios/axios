'use strict'
const axios = require('./axios')
const defaultInstance = axios.default

delete axios.default

Object.assign(defaultInstance, axios)

module.exports = defaultInstance
