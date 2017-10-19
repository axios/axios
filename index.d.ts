export interface AxiosTransformer {
  (data: any): any;
}

export interface AxiosAdapter<ResponseShape = any> {
  (config: AxiosRequestConfig): AxiosPromise<ResponseShape>;
}

export interface AxiosBasicCredentials {
  username: string;
  password: string;
}

export interface AxiosProxyConfig {
  host: string;
  port: number;
}

export interface AxiosRequestConfig<ResponseShape = any> {
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
  adapter?: AxiosAdapter<ResponseShape>;
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
  cancelToken?: CancelToken;
}

export interface AxiosResponse<ResponseShape = any> {
  data: ResponseShape;
  status: number;
  statusText: string;
  headers: any;
  config: AxiosRequestConfig<ResponseShape>;
}

export interface AxiosError<ResponseShape = any> extends Error {
  config: AxiosRequestConfig<ResponseShape>;
  code?: string;
  response?: AxiosResponse<ResponseShape>;
}

export interface AxiosPromise<ResponseShape = any> extends Promise<AxiosResponse<ResponseShape>> {
}

export interface CancelStatic {
  new (message?: string): Cancel;
}

export interface Cancel {
  message: string;
}

export interface Canceler {
  (message?: string): void;
}

export interface CancelTokenStatic {
  new (executor: (cancel: Canceler) => void): CancelToken;
  source(): CancelTokenSource;
}

export interface CancelToken {
  promise: Promise<Cancel>;
  reason?: Cancel;
  throwIfRequested(): void;
}

export interface CancelTokenSource {
  token: CancelToken;
  cancel: Canceler;
}

export interface AxiosInterceptorManager<V> {
  use(onFulfilled: (value: V) => V | Promise<V>, onRejected?: (error: any) => any): number;
  eject(id: number): void;
}

export interface AxiosInstance {
  defaults: AxiosRequestConfig<any>;
  interceptors: {
    request: AxiosInterceptorManager<AxiosRequestConfig<any>>;
    response: AxiosInterceptorManager<AxiosResponse<any>>;
  };
  request<ResponseShape = any>(config: AxiosRequestConfig<ResponseShape>): AxiosPromise<ResponseShape>;
  get<ResponseShape = any>(url: string, config?: AxiosRequestConfig<ResponseShape>): AxiosPromise<ResponseShape>;
  delete<ResponseShape = any>(url: string, config?: AxiosRequestConfig<ResponseShape>): AxiosPromise<ResponseShape>;
  head<ResponseShape = any>(url: string, config?: AxiosRequestConfig<ResponseShape>): AxiosPromise<ResponseShape>;
  post<ResponseShape = any>(url: string, data?: any, config?: AxiosRequestConfig<ResponseShape>): AxiosPromise<ResponseShape>;
  put<ResponseShape = any>(url: string, data?: any, config?: AxiosRequestConfig<ResponseShape>): AxiosPromise<ResponseShape>;
  patch<ResponseShape = any>(url: string, data?: any, config?: AxiosRequestConfig<ResponseShape>): AxiosPromise<ResponseShape>;
}

export interface AxiosStatic extends AxiosInstance {
  (config: AxiosRequestConfig): AxiosPromise;
  (url: string, config?: AxiosRequestConfig): AxiosPromise;
  create(config?: AxiosRequestConfig): AxiosInstance;
  Cancel: CancelStatic;
  CancelToken: CancelTokenStatic;
  isCancel(value: any): boolean;
  all<T>(values: (T | Promise<T>)[]): Promise<T[]>;
  spread<T, R>(callback: (...args: T[]) => R): (array: T[]) => R;
}

declare const Axios: AxiosStatic;

export default Axios;
