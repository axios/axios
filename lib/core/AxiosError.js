'use strict';

import utils from '../utils.js';
import AxiosHeaders from './AxiosHeaders.js';

export const REDACTED = '[REDACTED ****]';

function hasOwnOrPrototypeToJSON(source) {
  if (utils.hasOwnProp(source, 'toJSON')) {
    return true;
  }

  let prototype = Object.getPrototypeOf(source);

  while (prototype && prototype !== Object.prototype) {
    if (utils.hasOwnProp(prototype, 'toJSON')) {
      return true;
    }

    prototype = Object.getPrototypeOf(prototype);
  }

  return false;
}

// Build a plain-object snapshot of `config` and replace the value of any key
// (case-insensitive) listed in `redactKeys` with REDACTED. Walks through arrays
// and AxiosHeaders, and short-circuits on circular references.
function redactConfig(config, redactKeys) {
  const lowerKeys = new Set(redactKeys.map((k) => String(k).toLowerCase()));
  const seen = [];

  const visit = (source) => {
    if (source === null || typeof source !== 'object') return source;
    if (utils.isBuffer(source)) return source;
    if (seen.indexOf(source) !== -1) return undefined;

    if (source instanceof AxiosHeaders) {
      source = source.toJSON();
    }

    seen.push(source);

    let result;
    if (utils.isArray(source)) {
      result = [];
      source.forEach((v, i) => {
        const reducedValue = visit(v);
        if (!utils.isUndefined(reducedValue)) {
          result[i] = reducedValue;
        }
      });
    } else {
      if (!utils.isPlainObject(source) && hasOwnOrPrototypeToJSON(source)) {
        seen.pop();
        return source;
      }

      result = Object.create(null);
      for (const [key, value] of Object.entries(source)) {
        const reducedValue = lowerKeys.has(key.toLowerCase()) ? REDACTED : visit(value);
        if (!utils.isUndefined(reducedValue)) {
          result[key] = reducedValue;
        }
      }
    }

    seen.pop();
    return result;
  };

  return visit(config);
}

// Config keys whose values are platform handles rather than data. Node's
// `http(s).Agent`, sockets and transports cross-reference each other
// (agent <-> socket <-> parser <-> request <-> response), so descending into
// one produces a huge, mostly meaningless object graph; with a shared agent
// under concurrency it is enough to exhaust the heap. Snapshot them as a
// short marker instead.
const OPAQUE_CONFIG_KEYS = new Set(['httpagent', 'httpsagent', 'agent', 'transport', 'socket']);

// Own enumerable properties an AxiosError always carries. Everything else on
// the instance is a custom property supplied through `AxiosError.from`.
const STANDARD_ERROR_KEYS = new Set([
  'message',
  'name',
  'stack',
  'description',
  'number',
  'fileName',
  'lineNumber',
  'columnNumber',
  'config',
  'code',
  'status',
  'request',
  'response',
  'isAxiosError',
  'cause',
]);

function describeHandle(value) {
  let name;

  try {
    name = value && value.constructor && value.constructor.name;
  } catch (err) {
    name = undefined;
  }

  return `[${utils.isString(name) && name ? name : 'Object'}]`;
}

// Replace platform handles with a marker before the config is walked. Returns
// the original object untouched when there is nothing to replace, so the
// common case allocates nothing.
function withoutOpaqueHandles(config) {
  if (!utils.isObject(config)) {
    return config;
  }

  let result = null;

  for (const key of Object.keys(config)) {
    let value;

    try {
      value = config[key];
    } catch (err) {
      continue;
    }

    if (!utils.isObject(value)) {
      continue;
    }

    if (OPAQUE_CONFIG_KEYS.has(key.toLowerCase()) || utils.isStream(value)) {
      result = result || { ...config };
      result[key] = describeHandle(value);
    }
  }

  return result || config;
}

function stringifySafely(value) {
  try {
    return String(value);
  } catch (err) {
    return '';
  }
}

function aggregateErrorMessage(error) {
  const message = error.errors
    .map((entry) => {
      try {
        return entry && entry.message ? stringifySafely(entry.message) : stringifySafely(entry);
      } catch (err) {
        return '';
      }
    })
    .filter(Boolean)
    .join('; ');

  return message || error.name || 'AggregateError';
}

class AxiosError extends Error {
  static from(error, code, config, request, response, customProps) {
    // `AggregateError` (thrown by Node on dual-stack/Happy-Eyeballs connection
    // failures) has an empty `message`; its detail lives in `errors[]`. Without
    // this, the wrapped error surfaces with a blank message (see #6721).
    let message = error.message;
    if (!message && utils.isArray(error.errors) && error.errors.length) {
      message = aggregateErrorMessage(error);
    }

    const axiosError = new AxiosError(message, code || error.code, config, request, response);
    // Match native `Error` `cause` semantics: non-enumerable. The wrapped
    // error often carries circular internals (sockets, requests, agents), so
    // an enumerable `cause` makes structured loggers (pino/winston) and any
    // own-property walk throw "Converting circular structure to JSON".
    // Regression from #6982; see #7205. `__proto__: null` mirrors the
    // `message` descriptor below (prototype-pollution-safe descriptor).
    Object.defineProperty(axiosError, 'cause', {
      __proto__: null,
      value: error,
      writable: true,
      enumerable: false,
      configurable: true,
    });
    axiosError.name = error.name;

    // Preserve status from the original error if not already set from response
    if (error.status != null && axiosError.status == null) {
      axiosError.status = error.status;
    }

    customProps && Object.assign(axiosError, customProps);
    return axiosError;
  }

  /**
   * Create an Error with the specified message, config, error code, request and response.
   *
   * @param {string} message The error message.
   * @param {string} [code] The error code (for example, 'ECONNABORTED').
   * @param {Object} [config] The config.
   * @param {Object} [request] The request.
   * @param {Object} [response] The response.
   *
   * @returns {Error} The created error.
   */
  constructor(message, code, config, request, response) {
    super(message);

    // Make message enumerable to maintain backward compatibility
    // The native Error constructor sets message as non-enumerable,
    // but axios < v1.13.3 had it as enumerable
    Object.defineProperty(this, 'message', {
      // Null-proto descriptor so a polluted Object.prototype.get cannot turn
      // this data descriptor into an accessor descriptor on the way in.
      __proto__: null,
      value: message,
      enumerable: true,
      writable: true,
      configurable: true,
    });

    this.name = 'AxiosError';
    this.isAxiosError = true;
    code && (this.code = code);
    config && (this.config = config);
    request && (this.request = request);
    if (response) {
      this.response = response;
      this.status = response.status;
    }
  }

  toJSON() {
    // Opt-in redaction: when the request config carries a `redact` array, the
    // value of any matching key (case-insensitive, at any depth) is replaced
    // with REDACTED in the serialized snapshot. Undefined or empty leaves the
    // existing serialization behavior unchanged.
    const config = this.config;
    const redactKeys = config && utils.hasOwnProp(config, 'redact') ? config.redact : undefined;
    const redacting = utils.isArray(redactKeys) && redactKeys.length > 0;
    const snapshot = (value) =>
      redacting ? redactConfig(value, redactKeys) : utils.toJSONObject(value);
    const serializeValue = (value) =>
      utils.isStream(value) ? describeHandle(value) : snapshot(value);

    // Custom properties attached through `AxiosError.from(..., customProps)`
    // are own enumerable properties of the instance, but were dropped by the
    // fixed shape below, so error loggers never saw them.
    let customProps;

    for (const key of Object.keys(this)) {
      if (STANDARD_ERROR_KEYS.has(key)) {
        continue;
      }

      customProps = customProps || {};

      try {
        customProps[key] = serializeValue(this[key]);
      } catch (err) {
        customProps[key] = undefined;
      }
    }

    return {
      // Custom properties first, so a collision can never shadow a standard key.
      ...customProps,
      // Standard
      message: this.message,
      name: this.name,
      // Microsoft
      description: this.description,
      number: this.number,
      // Mozilla
      fileName: this.fileName,
      lineNumber: this.lineNumber,
      columnNumber: this.columnNumber,
      stack: this.stack,
      // Axios
      config: snapshot(withoutOpaqueHandles(config)),
      code: this.code,
      status: this.status,
    };
  }
}

// This can be changed to static properties as soon as the parser options in .eslint.cjs are updated.
AxiosError.ERR_BAD_OPTION_VALUE = 'ERR_BAD_OPTION_VALUE';
AxiosError.ERR_BAD_OPTION = 'ERR_BAD_OPTION';
AxiosError.ECONNABORTED = 'ECONNABORTED';
AxiosError.ETIMEDOUT = 'ETIMEDOUT';
AxiosError.ECONNREFUSED = 'ECONNREFUSED';
AxiosError.ERR_NETWORK = 'ERR_NETWORK';
AxiosError.ERR_FR_TOO_MANY_REDIRECTS = 'ERR_FR_TOO_MANY_REDIRECTS';
AxiosError.ERR_DEPRECATED = 'ERR_DEPRECATED';
AxiosError.ERR_BAD_RESPONSE = 'ERR_BAD_RESPONSE';
AxiosError.ERR_BAD_REQUEST = 'ERR_BAD_REQUEST';
AxiosError.ERR_CANCELED = 'ERR_CANCELED';
AxiosError.ERR_NOT_SUPPORT = 'ERR_NOT_SUPPORT';
AxiosError.ERR_INVALID_URL = 'ERR_INVALID_URL';
AxiosError.ERR_FORM_DATA_DEPTH_EXCEEDED = 'ERR_FORM_DATA_DEPTH_EXCEEDED';

export default AxiosError;
