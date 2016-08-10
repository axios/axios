export interface Thenable<V> {
  then<R>(onFulfilled?: (value: V) => R | Thenable<R>, onRejected?: (reason: any) => R | Thenable<R>): Thenable<R>;
  then<R>(onFulfilled?: (value: V) => R | Thenable<R>, onRejected?: (reason: any) => void): Thenable<R>;
  catch<R>(onRejected?: (reason: any) => R | Thenable<R>): Thenable<R>;
}

export interface AxiosDataTransformer {
  (data: any): any;
}

export interface AxiosRequestConfig {
  url?: string;
  method?: string;
  baseURL?: string;
  transformRequest?: AxiosDataTransformer | AxiosDataTransformer[];
  transformResponse?: AxiosDataTransformer | AxiosDataTransformer[];
  headers?: any;
  params?: any;
  paramsSerializer?: (params: any) => string;
  data?: any;
  timeout?: number;
  withCredentials?: boolean;
  adapter?: any;
  auth?: any;
  responseType?: string;
  xsrfCookieName?: string;
  xsrfHeaderName?: string;
  progress?: (progressEvent: any) => void;
  maxContentLength?: number;
  validateStatus?: (status: number) => boolean;
  maxRedirects?: number;
  httpAgent?: any;
  httpsAgent?: any;
}

export interface AxiosResponse {
  data: any;
  status: number;
  statusText: string;
  headers: any;
  config: AxiosRequestConfig;
}

export interface AxiosInstance {
  defaults: AxiosRequestConfig;
  request(config: AxiosRequestConfig): Thenable<AxiosResponse>;
  get(url: string, config?: AxiosRequestConfig): Thenable<AxiosResponse>;
  delete(url: string, config?: AxiosRequestConfig): Thenable<AxiosResponse>;
  head(url: string, config?: AxiosRequestConfig): Thenable<AxiosResponse>;
  post(url: string, data?: any, config?: AxiosRequestConfig): Thenable<AxiosResponse>;
  put(url: string, data?: any, config?: AxiosRequestConfig): Thenable<AxiosResponse>;
  patch(url: string, data?: any, config?: AxiosRequestConfig): Thenable<AxiosResponse>;
}

export interface AxiosStatic extends AxiosInstance {
  (config: AxiosRequestConfig): Thenable<AxiosResponse>;
  (url: string, config?: AxiosRequestConfig): Thenable<AxiosResponse>;
  create(config?: AxiosRequestConfig): AxiosInstance;
  all(iterable: any): Thenable<any>;
  spread(callback: any): Thenable<any>;
}

declare const Axios: AxiosStatic;

export default Axios;
