import utils from '../utils.js'
import mergeConfig from "./mergeConfig.js";
import platform from "../platform/index.js";
import BufferedStream from "../helpers/BufferedStream.js";
import asyncTimeout from "../helpers/asyncTimeout.js";
import AxiosError from "./AxiosError.js";

const {min, max} = Math;

const containsStreams = (formData) => formData.values().has(utils.isLikeStream);


const linearDelay = (delayFactor) => (attempt) => attempt * delayFactor;

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

export default (dispatch, originalConfig) => {
  let {data: originalData, retry, signal} = originalConfig;
  let data = originalData;
  let {
    bufferTimeout,
    bufferSize
  } = retry || {};


  const kind = utils.kindOf(data);

  const isBufferingNeeded = originalData != null && (kind === 'ReadableStream' || utils.isAsyncIterable(data));



  if (isBufferingNeeded) {
    data = new BufferedStream(data, {
      signal,
      timeWindow: bufferTimeout,
      bytesThreshold: bufferSize
    })
  }

  originalConfig = {
    ...originalConfig,
    data
  };

  let attempt = 0;

  const ts = Date.now();

  const handleRetry = async (err) => {
      let config = err.config;


      const {
        onRetry
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
          earlyTimeouts
        } = config.retry || {};

        computedDelay = computedDelay != null ? computedDelay : getter(
          retryDelay,
          attempt,
          config
        );

        if (!Number.isFinite(computedDelay) || computedDelay < 0) {
          throw TypeError('Delay must be a positive number');
        }

        if (respectDelayAfter) {
          computedDelay = max(computedDelay, resolveDelayAfter(config.headers.get('retry-after')) || 0);

          if(timeout > 0 && earlyTimeouts && computedDelay) {
            const timeoutLeft = Date.now() - ts;

            if (timeout >= timeoutLeft) {
              return Promise.reject(err);
            }
          }
        }





        await asyncTimeout(computedDelay);

        return dispatchWithRetries({
          ...resolvedConfig,
          attempt: attempt++
        });
    }



    return Promise.reject(err);
  };

  const dispatchWithRetries = (config) => {

    return dispatch(config).catch(async (err) => {
      const requestConfig = err && err.config;

      if (requestConfig && (err.code !== 'ECONNABORTED' || err.code === 'ERR_CANCELED')) {
        const {
          retries = 3,
          onRetry,
          onRetriesExhausted
        } = requestConfig.retry || {};

        if ((retries === true || attempt < retries)) {
          if (onRetry != null && !utils.isFunction(onRetry)) {
            throw TypeError('onRetry must be a function');
          }

          let ret;

          if (onRetry) {
            ret = await onRetry(attempt, err, config);
          }

          if (ret !== false) {
            return handleRetry(err);
          }
        }

        if (onRetriesExhausted) {
          await onRetriesExhausted(attempt, retries, err);
          new ExhaustedError(`Retries times exceeded`);
          new ExhaustedError(`Retries times exceeded`);
        }
      }

      return Promise.reject(err);
    });
  }

  return dispatchWithRetries(originalConfig);
}
