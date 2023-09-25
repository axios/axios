// noinspection JSUnusedGlobalSymbols,JSValidateTypes

import _axios from '../index.js';
import fetchHelpers from './fetch/fetch_helpers.js';
import { expect } from "@esm-bundle/chai";
import { newMockXhr } from 'mock-xmlhttprequest';

// Set to the active mock to allow interrogation of request state.
let activeMock = null;
let originalXHR = null;

/**
 * Describes the shape of an intercepted mock call to the XMLHttpRequest system.
 *
 * @typedef {{
 *     method: !string,
 *     url: !string,
 *     body: *,
 *     headers: record<string, string>,
 *     respond: function(opt_status: !int=, opt_headers: !object=, opt_body: !string=, opt_statusText: !string=): void
 * }}
 */
let MockXHRCall;

/**
 * Return the most recent XHR call.
 *
 * @return {?MockXHRCall}
 */
export function mostRecentXHR() {
  if (!activeMock) {
    throw new Error('Cannot retrieve XHR request: no active mock.');
  }
  const log = activeMock.getRequestLog();
  if (log.length > 0) {
    return log[0];
  }
  return null;  // no recent request
}

/**
 * Run the provided `operation` within the scope of a mock XHR implementation.
 *
 * @param {!function(!Done): void|!function(): Promise<*>} operation
 */
export function withMockXHR(operation) {
  async function doWithMock(done) {
    const mock = newMockXhr();
    try {
      activeMock = mock;
      originalXHR = window.XMLHttpRequest;
      window.XMLHttpRequest = mock;

      const promiseMaybe = operation.apply(this, [done]);
      if (promiseMaybe instanceof Promise) {
        await promiseMaybe;
      }

    } finally {
      window.XMLHttpRequest = originalXHR;
      activeMock = null;
    }
  }
  return doWithMock;
}


/**
 * Asynchronously retrieve the most recent mock XHR call.
 *
 * @return {Promise<MockXHRCall>}
 */
export function getAjaxRequest() {
  let attempts = 0;
  const MAX_ATTEMPTS = 5;
  const ATTEMPT_DELAY_FACTOR = 5;

  /** @return {!Promise<MockXHRCall>} */
  function getAjaxInner() {
    // noinspection JSValidateTypes
    return new Promise(function (resolve, reject) {
      attempts = 0;
      attemptGettingAjaxRequest(resolve, reject);
    });
  }

  /**
   * @param {!function(MockXHRCall): void} resolve Promise resolver
   * @param {!function(*): void} reject Promise rejection function
   */
  function attemptGettingAjaxRequest(resolve, reject) {
    const delay = attempts * attempts * ATTEMPT_DELAY_FACTOR;

    if (attempts++ > MAX_ATTEMPTS) {
      reject(new Error('No request was found'));
      return;
    }

    setTimeout(function () {
      const request = mostRecentXHR();
      if (request) {
        resolve(request);
      } else {
        attemptGettingAjaxRequest(resolve, reject);
      }
    }, delay);
  }

  return getAjaxInner();
}

/** @type {Axios & AxiosStatic} */
const testAxios = _axios;

export {
  fetchConfigurator,
  getFetch,
  getFetchAtIndex,
  withMockFetch,
} from './fetch/default_helpers.mjs';

export {
  expect,
  fetchHelpers,
  testAxios as axios
}

export default {
  expect,
  axios: testAxios,
  withMockXHR,
}
