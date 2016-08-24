export interface AxiosTransformer {
  (data: any): any;
}

export interface AxiosAdapter {
  (config: AxiosRequestConfig): AxiosPromise;
}

export interface AxiosBasicCredentials {
  username: string;
  password: string;
}

export interface AxiosProxyConfig {
  host: string;
  port: number;
}

export interface AxiosRequestConfig {
  url?: string;
  method?: string;
  baseURL?: string;
  transformRequest?: AxiosTransformer | AxiosTransformer[];
  transformResponse?: AxiosTransformer | AxiosTransformer[];
  headers?: any;
  params?: any;
  paramsSerializer?: (params: any) => string;
  data?: any;
  timeout?: number;
  withCredentials?: boolean;
  adapter?: AxiosAdapter;
  auth?: AxiosBasicCredentials;
  responseType?: string;
  xsrfCookieName?: string;
  xsrfHeaderName?: string;
  onUploadProgress?: (progressEvent: any) => void;
  onDownloadProgress?: (progressEvent: any) => void;
  maxContentLength?: number;
  validateStatus?: (status: number) => boolean;
  maxRedirects?: number;
  httpAgent?: any;
  httpsAgent?: any;
  proxy?: AxiosProxyConfig;
}

export interface AxiosResponse {
  data: any;
  status: number;
  statusText: string;
  headers: any;
  config: AxiosRequestConfig;
}

export interface AxiosError extends Error {
  config: AxiosRequestConfig;
  code?: string;
  response?: AxiosResponse;
}

export interface Promise<V> {
  then<R1, R2>(onFulfilled: (value: V) => R1 | Promise<R1>, onRejected: (error: any) => R2 | Promise<R2>): Promise<R1 | R2>;
  then<R>(onFulfilled: (value: V) => R | Promise<R>): Promise<R>;
  catch<R>(onRejected: (error: any) => R | Promise<R>): Promise<R>;
}

export interface AxiosPromise extends Promise<AxiosResponse> {
}

export interface AxiosInterceptorManager<V> {
  use(onFulfilled: (value: V) => V | Promise<V>, onRejected?: (error: any) => any): number;
  eject(id: number): void;
}

export interface AxiosInstance {
  defaults: AxiosRequestConfig;
  interceptors: {
    request: AxiosInterceptorManager<AxiosRequestConfig>;
    response: AxiosInterceptorManager<AxiosResponse>;
  };
  request(config: AxiosRequestConfig): AxiosPromise;
  get(url: string, config?: AxiosRequestConfig): AxiosPromise;
  delete(url: string, config?: AxiosRequestConfig): AxiosPromise;
  head(url: string, config?: AxiosRequestConfig): AxiosPromise;
  post(url: string, data?: any, config?: AxiosRequestConfig): AxiosPromise;
  put(url: string, data?: any, config?: AxiosRequestConfig): AxiosPromise;
  patch(url: string, data?: any, config?: AxiosRequestConfig): AxiosPromise;
}

export interface AxiosStatic extends AxiosInstance {
  (config: AxiosRequestConfig): AxiosPromise;
  (url: string, config?: AxiosRequestConfig): AxiosPromise;
  create(config?: AxiosRequestConfig): AxiosInstance;
  all<T>(values: (T | Promise<T>)[]): Promise<T[]>;
  spread<T, R>(callback: (...args: T[]) => R): (array: T[]) => R;
}

declare const Axios: AxiosStatic;

export default Axios;
