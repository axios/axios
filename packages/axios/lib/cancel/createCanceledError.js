'use strict';

import CanceledError from './CanceledError.js';
import AxiosError from '../core/AxiosError.js';

/**
 * Normalize arbitrary AbortSignal reasons without letting message conversion
 * interrupt transport cancellation. Each cancellation gets its own request context;
 * caller-supplied errors are never mutated, even when they are already canceled.
 */
export default function createCanceledError(reason, config, request) {
  let message;
  let cause = reason;

  try {
    if (reason != null) {
      if (typeof reason === 'object' || typeof reason === 'function') {
        // Also handles Errors and DOMExceptions from another realm. Avoid
        // coercing arbitrary objects, whose conversion hooks can throw.
        const reasonMessage = reason.message;
        if (typeof reasonMessage === 'string') {
          message = reasonMessage;
        }
      } else {
        // Explicit String conversion supports Symbol and preserves falsy values.
        message = String(reason);
      }
    }

    if (
      reason instanceof CanceledError &&
      reason.code === AxiosError.ERR_CANCELED &&
      typeof message === 'string'
    ) {
      const causeDescriptor = Object.getOwnPropertyDescriptor(reason, 'cause');
      if (causeDescriptor) {
        cause = reason.cause;
      }
    }
  } catch (err) {
    // Unreadable reasons must not stop cancellation.
  }

  const error = new CanceledError(message, config, request);
  Object.defineProperty(error, 'cause', {
    __proto__: null,
    value: cause,
    writable: true,
    configurable: true,
  });
  return error;
}
