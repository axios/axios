import Axios from './lib/core/Axios.js';
import AxiosHeaders from './lib/core/AxiosHeaders.js';
import AxiosError from './lib/core/AxiosError.js';
import CanceledError from './lib/cancel/CanceledError.js';
import axios from './lib/axios.js';

export {
  axios as default,
  Axios,
  AxiosHeaders,
  AxiosError,
  CanceledError,
};