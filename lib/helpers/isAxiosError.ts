'use strict';

import type AxiosError from 'lib/core/AxiosError';
import * as utils from '../utils'

/**
 * Determines whether the payload is an error thrown by Axios
 *
 * @param {*} payload The value to test
 *
 * @returns {boolean} True if the payload is an error thrown by Axios, otherwise false
 */
export default function isAxiosError(payload: any): payload is AxiosError {
  return utils.isObject(payload) && ((payload as Record<keyof any, any>).isAxiosError === true);
};
