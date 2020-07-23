/* eslint-disable no-param-reassign */
/*eslint consistent-return:0*/
'use strict';

// TODO: beforeRedirect, beforeRetry

var utils = require('../utils');
// this is the Hooks constructor
function Hooks() {}

/**
 * Registers the hooks
 * @param {Object} hooks this contains the array of pre and post hooks to be registered
 * @param {*} fn this is the main function to which pre and post hooks are added
 */
Hooks.prototype.register = function register(hooks, fn) {
  var currentSelf = this;
  if (utils.isUndefined(hooks)) {
    return false;
  }
  if (!utils.isFunction(fn)) {
    return false;
  }
  var hasHook = false;
  if (utils.isObject(hooks)) {
    // TODO: need to extract the hook verbs from the hook object and register them
    if (hooks.beforeRequest && hooks.beforeRequest.length > 0) {
      // register the pre hook
      hooks.beforeRequest.map(function registerPreHooks(pre) {
        if (utils.isFunction(pre)) {
          hasHook = true;
          currentSelf.pre(fn.name, pre);
        }
      });
    }
    if (hooks.beforeError && hooks.beforeError.length > 0) {
      hooks.beforeError.map(function registerBeforeErrorHooks(post) {
        if (utils.isFunction(post)) {
          hasHook = true;
          currentSelf.beforeError(fn.name, post);
        }
      });
    }
    if (hooks.afterResponse && hooks.afterResponse.length > 0) {
      // register the post hook
      hooks.afterResponse.map(function registerPostHooks(post) {
        if (utils.isFunction(post)) {
          hasHook = true;
          currentSelf.post(fn.name, post);
        }
      });
    }
    // register the function to the hook
    if (hasHook) {
      currentSelf.hook(
        fn.name,
        fn,
        utils.isFunction(hooks.errorHandler) ? hooks.errorHandler : null
      );
    }
  }
  return hasHook;
};

/**
 *  Declares a new hook to which you can add pres and posts
 *  @param {String} name of the function
 *  @param {Function} fn method
 *  @param {Function} err error handler callback
 */
Hooks.prototype.hook = function hook(name, fn, err) {
  if (arguments.length === 1 && utils.isString(arguments[0])) {
    //* lookup the function
    fn = this[name] || null;
    if (!fn) {
      throw new Error('no function with the name ' + name + ' found');
    }
  }
  if (!err) {
    err = function errorHandler() {
      throw new Error('add an Error Handler to handle error thrown in hooks');
    };
  }
  var currentSelf = this;
  var pres = (currentSelf._pres = currentSelf._pres || {});
  var posts = (currentSelf._posts = currentSelf._posts || {});
  var beforeErrors = (currentSelf._beforeErrors =
    currentSelf._beforeErrors || {});
  pres[name] = pres[name] || [];
  posts[name] = posts[name] || [];
  beforeErrors[name] = beforeErrors[name] || [];

  currentSelf[name] = function mainFunction() {
    var result = new Promise(function defaultReturnValue() {});
    var finishValue = new Promise(function defaultReturnValue() {});
    var called = false;
    var self = this;
    pres = self._pres[name];
    posts = self._posts[name];
    beforeErrors = self._beforeErrors[name];
    var hookArgs = [].slice.call(arguments);
    // this is called by the last post hook => what ever value is passed over by the last post hook is set as the new result value
    function noop() {
      if (arguments[0] instanceof Error) return err(arguments[0]);
      if (arguments.length) hookArgs = [].slice.call(arguments);
      if (hookArgs.length) {
        if (hookArgs[0] instanceof Promise) {
          result = hookArgs[0];
        } else {
          result = new Promise(function createReturnValue(res) {
            res(hookArgs[0]);
          });
        }
      }
    }
    function allPresDone() {
      if (called) return; // check if the function as been called
      if (arguments[0] instanceof Error) return err(arguments[0]);
      if (arguments.length) hookArgs = [].slice.call(arguments);
      var config = hookArgs[0] || {};
      called = true; // set the called to true
      result = fn.apply(self, hookArgs);
      // asign the result promise to the finishValue
      finishValue = result
        .then(function handlePostHooks(value) {
          if (config.responseType !== 'stream') {
            hookArgs = [
              value,
              function retryWithMergedOptions(updatedOptions) {
                // overwrite the hookArgs with the new return value
                hookArgs[0] = fn(Object.assign(config, updatedOptions));
              }
            ];
            var postChain = posts.map(function createPostHookWrapper(post, i) {
              function wrapper() {
                if (arguments[0] instanceof Error) return err(arguments[0]);
                if (arguments.length) hookArgs = [].slice.call(arguments);
                post.apply(self, [postChain[i + 1] || noop].concat(hookArgs));
              } // end wrapper = function () {...
              return wrapper;
            }); // end posts.map(...)noop
            if (postChain.length) {
              postChain[0]();
            }
          }
          return result;
        })
        .catch(function errorHandler(error) {
          // beforeError hook
          var beforeErrorChain = beforeErrors.map(
            function createBeforeErrorHookWrapper(post, i) {
              function wrapper() {
                if (arguments[0] instanceof Error) error = arguments[0];
                post.apply(
                  self,
                  [
                    beforeErrorChain[i + 1] ||
                      function passUserDefinedErrorOver() {
                        if (arguments[0] instanceof Error) error = arguments[0];
                      }
                  ].concat(error)
                );
              }
              return wrapper;
            }
          );
          if (beforeErrorChain.length) {
            beforeErrorChain[0]();
          }
          return new Promise(function newPromise(_, rej) {
            rej(error);
          });
        });
    }
    var preChain = pres.map(function createPreHookWrapper(pre, i) {
      function wrapper() {
        if (arguments[0] instanceof Error) return err(arguments[0]);

        if (arguments.length) hookArgs = [].slice.call(arguments);
        return pre.apply(
          self,
          [preChain[i + 1] || allPresDone].concat(hookArgs)
        );
      } // end wrapper = function () {...
      return wrapper;
    }); // end posts.map(...)

    (preChain[0] || allPresDone)();
    return finishValue;
  };
};

/**
 * register a pre hook
 * @param {*} name name of the hook function
 * @param {*} fn the pre method
 */
Hooks.prototype.pre = function pre(name, fn) {
  var currentSelf = this;
  var pres = (currentSelf._pres = currentSelf._pres || {});
  (pres[name] = pres[name] || []).push(fn);
  return this;
};

/**
 * Register a post hook
 *  @param {String} name name of the hook function
 *  @param {Function} fn the post method
 */
Hooks.prototype.post = function post(name, fn) {
  var currentSelf = this;
  var posts = (currentSelf._posts = currentSelf._posts || {});
  (posts[name] = posts[name] || []).push(fn);
  return this;
};

/**
 *  Register a beforeError hook
 *  @param {String} name name of the function
 *  @param {Function} fn the beforeError method
 */
Hooks.prototype.beforeError = function beforeError(name, fn) {
  var currentSelf = this;
  var beforeErrors = (currentSelf._beforeErrors =
    currentSelf._beforeErrors || {});
  (beforeErrors[name] = beforeErrors[name] || []).push(fn);
  return this;
};

module.exports = Hooks;
