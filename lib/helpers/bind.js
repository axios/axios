'use strict';

/**
 * 绑定方法
 * @param fn 方法
 * @param thisArg 函数运行时使用的 this 值
 * @returns {function(): *} 返回一个方法
 */
module.exports = function bind (fn, thisArg) {
    return function wrap () {
        var args = new Array(arguments.length);
        for (var i = 0; i < args.length; i++) {
            args[i] = arguments[i];
        }
        // apply方法调用一个具有给定this值的函数，以及作为一个数组（或类似数组对象）提供的参数。返回调用有指定this值和参数的函数的结果
        return fn.apply(thisArg, args);
    };
};

