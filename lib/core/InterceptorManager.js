'use strict';

import utils from '../utils.js';

const $internals = Symbol('internals');

function trimHandlers(handlers) {
  while (handlers.length && handlers[handlers.length - 1] === null) {
    handlers.pop();
  }
}

function syncHandlerEntries(manager, internals) {
  if (manager.handlers !== internals.handlersRef) {
    internals.handlersRef = manager.handlers;
    internals.handlerEntries.clear();
  }
}

class InterceptorManager {
  constructor() {
    this.handlers = [];
    this[$internals] = {
      handlersRef: this.handlers,
      handlerEntries: new Map(),
      iterationDepth: 0,
      nextId: 0,
    };
  }

  /**
   * Add a new interceptor to the stack
   *
   * @param {Function} fulfilled The function to handle `then` for a `Promise`
   * @param {Function} rejected The function to handle `reject` for a `Promise`
   * @param {Object} options The options for the interceptor, synchronous and runWhen
   *
   * @return {Number} An ID used to remove interceptor later
   */
  use(fulfilled, rejected, options) {
    const handler = {
      fulfilled,
      rejected,
      synchronous: options ? options.synchronous : false,
      runWhen: options ? options.runWhen : null,
    };
    const internals = this[$internals];

    syncHandlerEntries(this, internals);

    const id = internals.nextId++;

    this.handlers.push(handler);
    internals.handlerEntries.set(id, {
      handler,
      index: this.handlers.length - 1,
    });

    return id;
  }

  /**
   * Remove an interceptor from the stack
   *
   * @param {Number} id The ID that was returned by `use`
   *
   * @returns {void}
   */
  eject(id) {
    const internals = this[$internals];

    syncHandlerEntries(this, internals);

    const entry = internals.handlerEntries.get(id);

    if (entry) {
      internals.handlerEntries.delete(id);

      // Ignore IDs invalidated by clear or direct replacement of handlers.
      if (this.handlers[entry.index] !== entry.handler) {
        return;
      }

      this.handlers[entry.index] = null;

      // Do not reuse an index while forEach is walking its length snapshot.
      if (!internals.iterationDepth) {
        trimHandlers(this.handlers);
      }
    }
  }

  /**
   * Clear all interceptors from the stack
   *
   * @returns {void}
   */
  clear() {
    if (this.handlers) {
      this.handlers = [];
      syncHandlerEntries(this, this[$internals]);
    }
  }

  /**
   * Iterate over all the registered interceptors
   *
   * This method is particularly useful for skipping over any
   * interceptors that may have become `null` calling `eject`.
   *
   * @param {Function} fn The function to call for each interceptor
   *
   * @returns {void}
   */
  forEach(fn) {
    const internals = this[$internals];

    syncHandlerEntries(this, internals);

    internals.iterationDepth++;

    try {
      utils.forEach(this.handlers, function forEachHandler(h) {
        if (h !== null) {
          fn(h);
        }
      });
    } finally {
      if (!--internals.iterationDepth) {
        trimHandlers(this.handlers);
      }
    }
  }
}

export default InterceptorManager;
