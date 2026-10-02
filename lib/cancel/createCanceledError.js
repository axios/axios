'use strict';

import CanceledError from './CanceledError.js';
import isCancel from './isCancel.js';
import AxiosError from '../core/AxiosError.js';

/**
 * Normalize arbitrary AbortSignal reasons without letting message conversion
 * interrupt transport cancellation. Keep the original value outside the message.
 */
export default function createCanceledError(reason, config, request) {
  let message;

  try {
    if (
      isCancel(reason) &&
      reason.code === AxiosError.ERR_CANCELED &&
      typeof reason.message === 'string'
    ) {
      return reason;
    }

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
  } catch (err) {
    // Even revoked proxies or throwing message getters are valid abort reasons.
  }

  const error = new CanceledError(message, config, request);
  Object.defineProperty(error, 'cause', {
    __proto__: null,
    value: reason,
    writable: true,
    configurable: true,
  });
  return error;
}
