'use strict';

/**
 * Read the reason an abort signal was aborted with.
 *
 * `AbortSignal.reason` is where `controller.abort(reason)` puts its argument,
 * and it is the only way to tell one cancellation from another. Adapters
 * discarded it and reported every cancellation as a bare `canceled` error.
 *
 * Reading `reason` off a non-standard or branded signal can throw, so the
 * access is guarded.
 *
 * @param {Object} [signal] The signal the request was watching
 *
 * @returns {*} The abort reason, or undefined when there is none
 */
export default function abortReason(signal) {
  if (!signal || !signal.aborted) {
    return undefined;
  }

  try {
    return signal.reason;
  } catch (err) {
    return undefined;
  }
}
