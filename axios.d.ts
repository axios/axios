// Type definitions for Axios v0.7.0
// Project: https://github.com/mzabriskie/axios

import {Promise} from 'es6-promise'

interface AxiosRequestMethods {
  get(url: string, config?: SpecificRequestOptions): Promise<Response>;
  delete(url: string, config?: SpecificRequestOptions): Promise<Response>;
  head(url: string, config?: SpecificRequestOptions): Promise<Response>;
  post(url: string, data: any, config?: SpecificRequestOptions): Promise<Response>;
  put(url: string, data: any, config?: SpecificRequestOptions): Promise<Response>;
  patch(url: string, data: any, config?: SpecificRequestOptions): Promise<Response>;
}

export interface AxiosInstance extends AxiosRequestMethods  {
  request(options: RequestOptions): Promise<Response>;
}

interface Response {
  data?: any;
  status?: number;
  statusText?: string;
  headers?: any;
  config?: any;
}

export interface InstanceOptions {
  transformRequest?: (data: any) => any;
  transformResponse?: (data: any) => any;
  headers?: any;
  timeout?: number;
  withCredentials?: boolean;
  responseType?: string;
  xsrfCookieName?: string;
  xsrfHeaderName?: string;
  paramsSerializer?: (params: any) => string;
}

export interface RequestOptions extends InstanceOptions {
  url: string;
  method?: string;
  params?: any;
  data?: any;
}

export interface SpecificRequestOptions extends InstanceOptions {
  params?: any;
  data?: any;
}

export function get(url: string, config?: any): Promise<Response>;
export function _delete(url: string, config?: any): Promise<Response>;
export {_delete as delete};
export function head(url: string, config?: any): Promise<Response>;
export function post(url: string, data: any, config?: any): Promise<Response>;
export function put(url: string, data: any, config?: any): Promise<Response>;
export function patch(url: string, data: any, config?: any): Promise<Response>;
export function create(defaultOptions?: InstanceOptions): AxiosInstance;
export function all(iterable: any): Promise<Response>;
export function spread(callback: any): Promise<Response>;
