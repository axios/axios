'use strict';

import platform from '../platform/index.js';
import utils from '../utils.js';

/**
 * Build the list of URL schemes a request is allowed to use.
 *
 * The platform list is fixed (`http`, `https`, `file`, `data`, plus `blob` and
 * `url` in browsers), which makes axios unusable behind the custom schemes that
 * native shells such as Capacitor register for their local resources.
 *
 * `config.additionalProtocols` extends that list. It never removes anything, so
 * a value arriving from a polluted prototype or an untrusted config cannot
 * narrow the platform defaults or turn protocol validation off; only own
 * properties are read, and non-string entries are ignored.
 *
 * @param {Object} [config] The request config
 *
 * @returns {string[]} Accepted schemes, without a trailing colon
 */
export default function resolveProtocols(config) {
  const additional =
    config && utils.hasOwnProp(config, 'additionalProtocols')
      ? config.additionalProtocols
      : undefined;

  if (!utils.isArray(additional) || !additional.length) {
    return platform.protocols;
  }

  const protocols = platform.protocols.slice();

  additional.forEach((protocol) => {
    if (!utils.isString(protocol)) {
      return;
    }

    // Accept both `capacitor` and `capacitor:`.
    const normalized = protocol.trim().toLowerCase().replace(/:$/, '');

    if (normalized && protocols.indexOf(normalized) === -1) {
      protocols.push(normalized);
    }
  });

  return protocols;
}
