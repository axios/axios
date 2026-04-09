import utils from '../utils.js'
import mergeConfig from "./mergeConfig.js";
import platform from "../platform/index.js";
import BufferedStream from "../helpers/BufferedStream.js";
import asyncTimeout from "../helpers/asyncTimeout.js";
import AxiosError from "./AxiosError.js";
import CanceledError from "../cancel/CanceledError.js";
import RetryError from "./RetryError.js";

const {min, max} = Math;

const containsStreams = (formData) => formData.values().has(utils.isLikeStream);


const linearDelay = (delayFactor) => (attempt) => {
  return attempt * delayFactor;
}

const exponentialDelay = (baseDelay, rndFactor = 0.2) => {
  rndFactor = max(min(rndFactor, 1), 0);

  return (attempt) => {
    const delay = baseDelay * 2 ** attempt;
    return delay + delay * rndFactor * Math.random();
  }
}

const defaultExponentialDelay = exponentialDelay(1000);

const resolveDelayAfter = (rawHeaderValue) => {
  if (utils.isString(rawHeaderValue) && (rawHeaderValue = rawHeaderValue.trim())) {
    let delay = utils.toFiniteNumber(rawHeaderValue);

    if (delay != null) {
      return delay < 0 ? undefined : delay * 1000;
    }

    delay = new Date(rawHeaderValue) - Date.now();

    if (Number.isFinite(delay)) {
      return max(delay, 0);
    }
  }
}

const getter = (valueOrFn, ...args) =>
  valueOrFn && utils.isFunction(valueOrFn) ? valueOrFn(...args) : valueOrFn;

const delaysList = (...delays) => (attempt) => +delays[attempt >= delays.length ? delays.length - 1: attempt] || 0

const delayGetter = (valueOrFn, attempt, config) =>
  utils.isArray(valueOrFn) ? delaysList(valueOrFn) : getter(valueOrFn, attempt, config);

const stringMatcher = (value) => {
  value = String(value).toUpperCase();
  return (el) => String(el).trim().toUpperCase() === value;
}

// [GET, POST]  GET
// [[300-299], 400, [500]]

const statusMatcher = (statusCode) => {
  return filterEntry => {
    let isArrayEntry;

    if(utils.isString(filterEntry)) {
      let match = /^(\d+)(-)?(\d*)$/.exec(filterEntry.trim());

      if(!match) {
        throw TypeError(`Unknown status signature '${filterEntry}'`);
      }

      filterEntry = match[2] ? [match[1], match[3] = Infinity] : [match[1]];

      isArrayEntry = true;
    }

    if (isArrayEntry || utils.isArray(filterEntry)) {
      return filterEntry.length > 1 ?
        statusCode >= filterEntry[0] && statusCode <= filterEntry[1] : statusCode === filterEntry[0];
    }

    return statusCode === filterEntry;
  }
}


const matchFilter = (filter, matcher) =>
  !filter || (utils.isArray(filter) ? filter.some(matcher) : matcher(filter));



const generateRequestId = typeof crypto === 'object' ?
  () => crypto.randomUUID() :
  (config) => null;

console.log(generateRequestId());

const SAFE_HTTP_METHODS  = ['GET', 'HEAD', 'OPTIONS'];

const IDEMPOTENT_HTTP_METHODS = [...SAFE_HTTP_METHODS, 'PUT', 'DELETE'];

//const safeMethods = utils.toObjectSet('get head options', ' ');


export default (dispatch, originalConfig) => {
  let {data: originalData, retry, transitional} = originalConfig;
  let data = originalData;

  const {method} = originalConfig;
  const methodL = method.toLowerCase();


  if (transitional && transitional.useRetries) {

    let {
      httpMethods = IDEMPOTENT_HTTP_METHODS,
      idempotencyKeyHeader = 'Idempotency-Key',
      idempotencyKey = idempotencyKeyHeader ? generateRequestId(originalConfig) : null,
      idempotencyMethods = IDEMPOTENT_HTTP_METHODS,
      xRetryHeaderName = 'X-Retry'
    } = retry || {};

    httpMethods = utils.list(httpMethods);
    idempotencyMethods = utils.list(idempotencyMethods);

    let isRetryableMethod = httpMethods[methodL];

    if (
      isRetryableMethod &&
      idempotencyKeyHeader &&
      idempotencyKey &&
      !idempotencyMethods[methodL]
    ) {
      originalConfig.headers.set(idempotencyKeyHeader, idempotencyKey, false);
    }








    originalConfig = {
      ...originalConfig,
      data
    };

    let attempt = 0;

    const dispatchedAt = Date.now();

    const handleRetry = async (err) => {
      let config = err.config;


      const {
        onRetry,
        onRetriesExhausted
      } = config.retry || {};


      let ret;

      if (onRetry) {
        ret = await onRetry(attempt, err, config);
      }

      if (ret !== false) {

        let computedDelay;

        if (Number.isFinite(ret) && ret >= 0) {
          computedDelay = ret;
        }

        let {
          timeout
        } = config;

        let {
          retryDelay = defaultExponentialDelay,
          respectDelayAfter = true,
          // minimum required remaining time to retry a request
          earlyTimeoutGap = 500
        } = config.retry || {};

        computedDelay = +(computedDelay != null ? computedDelay : delayGetter(
          retryDelay,
          attempt,
          config
        ));


        if (!Number.isFinite(computedDelay) || computedDelay < 0) {
          throw TypeError('Delay must be a positive number');
        }

        if (respectDelayAfter) {
          computedDelay = max(computedDelay, resolveDelayAfter(config.headers.get('retry-after')) || 0);
        }

        console.log('handleRetry' + err, computedDelay);

        if (timeout > 0 && earlyTimeoutGap > 0 && computedDelay) {
          const timeLeft = timeout - Date.now() - dispatchedAt;

          if (timeLeft < earlyTimeoutGap) {
            if (onRetriesExhausted) {
              await onRetriesExhausted(RetryError.from(err).enhance({
                message: 'Retry timeout exceeded',
                code: AxiosError.ERR_RETRY_TIMEOUT,
                attempt
              }));
            }
            return Promise.reject(err);
          }
        }


        console.log('await Delay', computedDelay);

        await asyncTimeout(computedDelay, config.signal);

        xRetryHeaderName && config.headers.set(xRetryHeaderName, attempt + 1, false);

        return dispatchWithRetries(utils.merge(
          config,
          {
            meta: {
              retryAttempt: ++attempt
            }
          }
        ));
      }


      return Promise.reject(err);
    };

    const dispatchWithRetries = (config) => {

      console.log('dispatchWithRetries', attempt);

      return dispatch(config).catch(async (err) => {
        const requestConfig = err && err.config;

        if (requestConfig && (err.code !== 'ECONNABORTED' || err instanceof CanceledError)) {
          const {
            retries = 3,
            onRetry,
            onRetriesExhausted,
            statusCodes = 	[[100, 199], 429, [500, 599]]
          } = requestConfig.retry || {};

          try {
            if (config.transitional && config.transitional.useRetries && (retries === true || attempt < retries) &&
              isRetryableMethod &&
              matchFilter(statusCodes, statusMatcher(err.status))
            ) {
              if (onRetry != null && !utils.isFunction(onRetry)) {
                throw TypeError('onRetry must be a function');
              }

              let ret;

              if (onRetry) {
                ret = await onRetry(attempt, err, config);
              }

              if (ret !== false) {
                if(
                  !IDEMPOTENT_HTTP_METHODS.has(method) &&
                  idempotencyKeyHeader &&
                  !idempotencyKeyHeader
                ) {
                  throw Error(`idempotency key is required for '${method}'`);
                }

                return await handleRetry(err);
              }
            }

            if (attempt && onRetriesExhausted) {
              await onRetriesExhausted(RetryError.from(err).enhance({
                message: 'Retry limit exceeded',
                code: AxiosError.ERR_RETRY_LIMIT,
                attempt
              }, true));
            }
          } catch(err) {
            throw err instanceof AxiosError ? err.enhance({
              config: requestConfig
            }) : err;
          }
        }

        return Promise.reject(err);
      });
    }

    return dispatchWithRetries(originalConfig);
  }

  return dispatch(originalConfig);
}
