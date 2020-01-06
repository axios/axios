'use strict';

var Cancel = require('./Cancel');

/**
 * A `CancelToken` is an object that can be used to request cancellation of an operation.
 *
 * @class
 * @param {Function} executor The executor function.
 */
function CancelToken (executor) {
    if (typeof executor !== 'function') {
        throw new TypeError('executor must be a function.');
    }
    
    var resolvePromise;
    // 创建一个Promise，在调用cancel函数前该promise会一直处于pending状态
    this.promise = new Promise(function promiseExecutor (resolve) {
        resolvePromise = resolve;
    });
    
    var token = this;
    executor(function cancel (message) {
        // 判断是否已经取消请求
        if (token.reason) {
            // Cancellation has already been requested
            return;
        }
        // 创建取消请求的信息，并将信息添加到实例reason属性上
        token.reason = new Cancel(message);
        // 结束this.promise的pending状态，将this.promise的状态设置成resolve
        resolvePromise(token.reason);
    });
}

/**
 * Throws a `Cancel` if cancellation has been requested.
 */
// 判断请求是否已经被取消的方法
CancelToken.prototype.throwIfRequested = function throwIfRequested () {
    if (this.reason) {
        throw this.reason;
    }
};

/**
 * Returns an object that contains a new `CancelToken` and a function that, when called,
 * cancels the `CancelToken`.
 */
CancelToken.source = function source () {
    var cancel;
    var token = new CancelToken(function executor (c) {
        cancel = c;
    });
    return {
        token: token,
        cancel: cancel
    };
};

module.exports = CancelToken;
