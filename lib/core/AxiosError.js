'use strict';

import utils from '../utils.js';
import AxiosHeaders from './AxiosHeaders.js';

export const REDACTED = '[REDACTED ****]';

// Node agents pin live socket and request maps whose shared subgraphs get
// re-serialized once per reference path, so a logged AxiosError can grow
// without bound and OOM the process (#11145). The config is snapshotted into
// a thawed, prototype-preserving clone where any class instance stored under
// an httpAgent/httpsAgent key is replaced by a bounded '[Name]' label at any
// depth. The clone keeps every enumerable string-keyed property, evaluates
// accessors once against the live config so getters observe the real agent,
// preserves toJSON hooks through the prototype, and handles frozen configs
// and circular references without touching the original object.
const AGENT_KEYS = ['httpAgent', 'httpsAgent'];
const NATIVE_CTOR_SOURCE = /\{\s*\[native code\]\s*\}/;

function isLabelableAgent(value) {
  return (
    utils.isObject(value) && !utils.isPlainObject(value) && !utils.isArray(value)
  );
}

function agentLabel(agent) {
  let name;
  try {
    name = agent.constructor && agent.constructor.name;
  } catch (e) {
    // a throwing constructor accessor still gets the generic label
  }
  return `[${name || 'Agent'}]`;
}

// Builtin and subclassed instances hold their data in internal slots a clone
// cannot carry, and objects that decide their own JSON shape via toJSON need
// their real internals for the hook. Everything else is cloned so references
// back into the config stay bounded.
function isSnapshotPassThrough(value) {
  if (
    hasOwnOrPrototypeToJSON(value) ||
    utils.isBuffer(value) ||
    utils.isStream(value) ||
    utils.isFormData(value) ||
    utils.isSpecCompliantForm(value) ||
    utils.isURLSearchParams(value) ||
    utils.isReadableStream(value) ||
    utils.isRequest(value) ||
    utils.isResponse(value) ||
    utils.isHeaders(value) ||
    utils.isArrayBuffer(value) ||
    utils.isArrayBufferView(value) ||
    utils.isBlob(value) ||
    utils.isFile(value) ||
    utils.isFileList(value) ||
    value instanceof Set ||
    value instanceof Map ||
    value instanceof WeakSet ||
    value instanceof WeakMap ||
    value instanceof Date ||
    value instanceof RegExp ||
    value instanceof Promise ||
    value instanceof Error
  ) {
    return true;
  }
  if (utils.isArray(value) || utils.isPlainObject(value)) {
    return false;
  }
  let ctor;
  try {
    ctor = value && value.constructor;
  } catch (e) {
    return false;
  }
  return (
    utils.isFunction(ctor) &&
    NATIVE_CTOR_SOURCE.test(Function.prototype.toString.call(ctor))
  );
}

function boundedConfigSnapshot(config, redactKeys) {
  if (!utils.isObject(config) || isSnapshotPassThrough(config)) {
    return config;
  }

  const cloned = new WeakMap();
  const redacted =
    redactKeys &&
    new Set(redactKeys.map((key) => String(key).toLowerCase()));

  const snapshot = (target) => {
    let copy = cloned.get(target);

    if (!copy) {
      copy = utils.isArray(target) ? [] : Object.create(Object.getPrototypeOf(target));
      cloned.set(target, copy);

      const descriptors = Object.getOwnPropertyDescriptors(target);

      for (const key of Object.keys(descriptors)) {
        if (utils.isArray(target) && key === 'length') {
          continue;
        }
        const desc = descriptors[key];
        if (!desc.enumerable) {
          // serializers only walk enumerable keys, so a hidden accessor must
          // never be invoked here either
          continue;
        }
        let value;
        if (redacted && !utils.isArray(target) && redacted.has(key.toLowerCase())) {
          // redactConfig replaces this slot wholesale, so the original value
          // is never evaluated or descended into. Array indices are not
          // redactable keys there, so elements still get cloned and bounded.
          value = 'value' in desc ? desc.value : null;
        } else {
          // data slots copy verbatim; accessors evaluate once on the live
          // target so a getter still observes the real agent
          value = 'value' in desc ? desc.value : target[key];
          if (AGENT_KEYS.includes(key) && isLabelableAgent(value)) {
            value = agentLabel(value);
          } else if (
            value !== null &&
            utils.isObject(value) &&
            !isSnapshotPassThrough(value)
          ) {
            value = snapshot(value);
          }
        }
        Object.defineProperty(copy, key, {
          value,
          writable: true,
          enumerable: true,
          configurable: true
        });
      }

      if (utils.isArray(target) && descriptors.length) {
        copy.length = descriptors.length.value;
      }
    }

    return copy;
  };

  return snapshot(config);
}

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

// Shared with `Axios.prototype.request`, which splices the reconstructed
// caller frames in ahead of this marker.
export const CAUSED_BY_SEPARATOR = '\nCaused by: ';
const $causeStack = Symbol('causeStack');

// Match the section we appended, not marker-like text in an error message or
// a replacement stack supplied by the caller. Do not re-read the cause's stack.
export function getCauseStackIndex(error, stack) {
  const causeStack = utils.hasOwnProp(error, $causeStack) && error[$causeStack];

  return causeStack && stack.endsWith(causeStack) ? stack.length - causeStack.length : -1;
}

/**
 * Append the stack of a wrapped error to `target.stack`.
 *
 * `cause` already exposes the original error for tooling that walks the standard
 * cause chain, but many error reporters read `stack` and nothing else. Inlining
 * the wrapped stack there means those reporters surface the underlying failure
 * instead of the axios frames that normalized it (see #6670).
 *
 * Every read is defensive: a custom `Error.prepareStackTrace` hook, a runtime
 * without stack support, or a replaced `stack` property can leave the value
 * missing, non-string, or read-only, and normalizing an error must not throw
 * because of that.
 *
 * @param {Error} target The AxiosError being built.
 * @param {Error} source The error being wrapped.
 *
 * @returns {void}
 */
function appendCauseStack(target, source) {
  try {
    const sourceStack = source && source.stack;

    if (typeof sourceStack !== 'string' || !sourceStack) {
      return;
    }

    const targetStack = target.stack;

    if (typeof targetStack !== 'string' || !targetStack) {
      return;
    }

    // Each call to `from()` creates a fresh target. Re-wrapping includes the
    // previous stack verbatim, adding one cause section per wrap.
    const causeStack = CAUSED_BY_SEPARATOR + sourceStack;
    target.stack = targetStack + causeStack;
    Object.defineProperty(target, $causeStack, { __proto__: null, value: causeStack });
  } catch (e) {
    // Ignore failures from custom stack hooks or un-writable stack properties.
  }
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

    // Inline the wrapped stack for reporters that read only `stack`; the `cause`
    // property above already covers cause-aware tooling.
    appendCauseStack(axiosError, error);

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
    const boundedConfig = boundedConfigSnapshot(
      config,
      utils.isArray(redactKeys) && redactKeys.length > 0 ? redactKeys : undefined
    );
    const serializedConfig =
      utils.isArray(redactKeys) && redactKeys.length > 0
        ? redactConfig(boundedConfig, redactKeys)
        : utils.toJSONObject(boundedConfig);

    return {
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
      config: serializedConfig,
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
