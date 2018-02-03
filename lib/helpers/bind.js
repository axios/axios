'use strict'

module.exports = function bind (fn, thisArg) {
  return function wrap () {
    const args = new Array(arguments.length)
    for (let i = 0; i < args.length; i++) {
      args[i] = arguments[i]
    }
    return fn.apply(thisArg, args)
  }
}
