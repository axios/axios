'use strict';

var isAxiosError = require('../helpers/isAxiosError');
var utils = require('./../utils');

/**
 * Call defaultReject function of axios instance if appropriate conditions are met
 *
 * @param {Object} instance The axios instance that owns defaultReject
 * @param {Object} axiosError The axios error linked to the failed request
 * @param {Object} unhandledPromiseEvent The whole unhandledPromise event
 * @param {Promise} promise The rejected promise
 */
function useDefaultReject(
  instance,
  axiosError,
  unhandledPromiseEvent,
  promise
) {
  if (
    isAxiosError(axiosError) &&
	typeof instance.defaults.defaultReject === 'function' &&
	// Only execute the defaultReject of the axios instance that was used
	axiosError.config._instanceId === instance._instanceId
  ) {
    promise.catch(function catchUnhandledPromise() {
      instance.defaults.defaultReject(axiosError);
      if (typeof unhandledPromiseEvent.preventDefault === 'function') {
        unhandledPromiseEvent.preventDefault();
      }
    });
  }
}

/**
 * @typedef EventHandlerReference
 * @type {object}
 * @property {Function} handler Function that is executed when event is triggered
 * @property {string} eventType Type of the handled event
 */
var handlerReferences = [];

/**
 * @callback ListenerRemovalConditionCallback
 * @param {EventHandlerReference} ref Reference to the handler that should be removed or not
 * @param {number} index Index of the current ref in the handlerReferences array
 * @param {Array} array Whole handlerReferences array
 * @return {boolean} Whether we want to remove the handler or not
 */

/**
 * Store references of added handlers in an Array and remove from that
 *
 * @param {boolean} attach Whether the listener needs to be added (true) or removed (false)
 * @param {Function} handler The handler which will be added in case attach is true
 * @param {Object} target The object on which listener is attached/removed
 * @param {string} eventType The type of the event we want to listen to
 * @param {ListenerRemovalConditionCallback} listenerRemovalCondition Callback executed during iteration of handlerReferences.
 * - Returns a condition at which a listener should be removed
 * - Removes all listeners by default
 * @param {Object} [additionalHandlerRefProperties] Object to merge with EventHandlerReference
 * @param {string} [attachMethodName=addEventListener] The method of target object used to attach a listener;
 * @param {string} [detachMethodName=removeEventListener] The method of target object used to remove a listener;
 */
function listenWithCleanup(attach, handler, target, eventType, listenerRemovalCondition, additionalHandlerRefProperties, attachMethodName, detachMethodName) {
  if (attach) {
  	// Add listener
    target[attachMethodName](eventType, handler);

    // Register reference to handler
    var refToAdd = { handler: handler, eventType: eventType };
    if (utils.isPlainObject(additionalHandlerRefProperties)) {
    	refToAdd = utils.merge(refToAdd, additionalHandlerRefProperties);
    }
    handlerReferences.push(refToAdd);
  } else {
    // Determine which listeners to remove
    var toRemove = handlerReferences.filter(function filterRefs(ref, index, array) {
      var shouldBeRemoved;
      if (typeof listenerRemovalCondition !== 'function') {
        shouldBeRemoved = true;
      } else {
        shouldBeRemoved = listenerRemovalCondition(ref, index, array);
      }

      if (shouldBeRemoved) {
      	// Delete refs of removed event listeners
      	handlerReferences.splice(index, 1);
      }
      return shouldBeRemoved;
    });

    // Remove listeners
    utils.forEach(toRemove, function forEachRef(ref) {
      target[detachMethodName](eventType, ref.handler);
    });
  }
}

/**
 * Add or remove an unhandledRejection event listener from axios instance
 * Calls listenWithCleanup with appropriate parameters
 *
 * @param {boolean} attach Whether the listener needs to be added (true) or removed (false)
 * @param {object} instance The axios instance that owns defaultReject
 */
function toggleListener(attach, instance) {
  var handler;
  var target;
  var attachMethodName;
  var detachMethodName;
  var eventType = 'unhandledrejection';

  // Axios instance can only remove its own listeners
  var additionalHandlerRefProperties = { _instanceId: instance._instanceId };
  var listenerRemovalCondition = function listenerRemovalCondition(ref) {
    return ref._instanceId === instance._instanceId;
  };

  if (utils.isNodeEnv()) {
    // For node attach listener on process
    target = process;
    attachMethodName = 'addListener';
    detachMethodName = 'removeListener';
    handler = function handleServerSideUnhandledRejection(e, promise) {
      useDefaultReject(instance, e, e, promise);
    };
  } else if (typeof window !== 'undefined') {
    // For browsers attach listener on window
    target = window;
    attachMethodName = 'addEventListener';
    detachMethodName = 'removeEventListener';
    handler = function handleBrowserSideUnhandledRejection(e) {
      useDefaultReject(instance, e.reason, e, e.promise);
    };
  } else { return; }

  listenWithCleanup(attach, handler, target, eventType, listenerRemovalCondition, additionalHandlerRefProperties, attachMethodName, detachMethodName);
}

/**
 * Call toggleListener with attach = true
 * @param {Object} instance The axios instance
 */
function installListener(instance) {
  toggleListener(true, instance);
}

/**
 * Call toggleListener with attach = false
 * @param {Object} instance The axios instance
 */
function ejectListener(instance) {
  toggleListener(false, instance);
}

/**
 * Configure defaultReject at instance creation
 *
 * @param {object} axiosInstance The axios instance whose default reject we configure
 */
module.exports = function configureDefaultReject(axiosInstance) {
  // Attach initial event listener
  if (typeof axiosInstance.defaults.defaultReject === 'function') {
  	installListener(axiosInstance);
  }

  // Define setter/getter for defaultReject
  Object.defineProperties(axiosInstance.defaults, {
  	_defaultReject: {
  		value: axiosInstance.defaults.defaultReject,
  		writable: true, configurable: true
  	},
  	defaultReject: {
	  	get: function getter() {
	  		return this._defaultReject;
	  	},
	    set: function setter(handler) {
	      if (typeof window !== 'undefined' && typeof window.onunhandledrejection === 'undefined') {
	      	throw new Error('Your browser does not support the defaultReject feature of axios');
	      }

		    // Clear previous event listener
		    ejectListener(axiosInstance);

		    // Replace defaultReject
		    this._defaultReject = handler;

		    // Attach new listener
		    if (typeof handler === 'function') {
	        installListener(axiosInstance);
		    }
	    }
	  }
  });
};
