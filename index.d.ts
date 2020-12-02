export interface AxiosTransformer {
  (data: any, headers?: any): any;
}

export interface AxiosAdapter {
  (config: AxiosRequestConfig): AxiosPromise<any>;
}

export interface AxiosBasicCredentials {
  username: string;
  password: string;
}

export interface AxiosProxyConfig {
  host: string;
  port: number;
  auth?: {
    username: string;
    password:string;
  };
  protocol?: string;
}

export type Method =
  | 'get' | 'GET'
  | 'delete' | 'DELETE'
  | 'head' | 'HEAD'
  | 'options' | 'OPTIONS'
  | 'post' | 'POST'
  | 'put' | 'PUT'
  | 'patch' | 'PATCH'
  | 'purge' | 'PURGE'
  | 'link' | 'LINK'
  | 'unlink' | 'UNLINK'

export type ResponseType =
  | 'arraybuffer'
  | 'blob'
  | 'document'
  | 'json'
  | 'text'
  | 'stream'

export interface AxiosRequestConfig {
  url?: string;
  method?: Method;
  baseURL?: string;
  transformRequest?: AxiosTransformer | AxiosTransformer[];
  transformResponse?: AxiosTransformer | AxiosTransformer[];
  headers?: any;
  params?: any;
  paramsSerializer?: (params: any) => string;
  data?: any;
  timeout?: number;
  timeoutErrorMessage?: string;
  withCredentials?: boolean;
  adapter?: AxiosAdapter;
  auth?: AxiosBasicCredentials;
  responseType?: ResponseType;
  xsrfCookieName?: string;
  xsrfHeaderName?: string;
  onUploadProgress?: (progressEvent: any) => void;
  onDownloadProgress?: (progressEvent: any) => void;
  maxContentLength?: number;
  validateStatus?: ((status: number) => boolean) | null;
  maxBodyLength?: number;
  maxRedirects?: number;
  socketPath?: string | null;
  httpAgent?: any;
  httpsAgent?: any;
  proxy?: AxiosProxyConfig | false;
  cancelToken?: CancelToken;
  decompress?: boolean;
}

export interface AxiosResponse<T = any>  {
  data: T;
  status: number;
  statusText: string;
  headers: any;
  config: AxiosRequestConfig;
  request?: any;
}

export interface AxiosError<T = any> extends Error {
  config: AxiosRequestConfig;
  code?: string;
  request?: any;
  response?: AxiosResponse<T>;
  isAxiosError: boolean;
  toJSON: () => object;
}

export interface AxiosPromise<T = any> extends Promise<AxiosResponse<T>> {
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

export interface AxiosRequestInterceptorManager<V> {
  use(onFulfilled?: (value: V) => V | Promise<V>, onRejected?: (error: any) => any): number;
  eject(id: number): void;
}

export interface AxiosResponseInterceptorManager {
  use(onFulfilled?: (value: AxiosResponse) => any | Promise<any>, onRejected?: (error: any) => any): number;
  eject(id: number): void;
}

export interface AxiosInstance<Config extends AxiosRequestConfig = AxiosRequestConfig> {
  (config: Config): AxiosPromise;
  (url: string, config?: Config): AxiosPromise;
  defaults: Config;
  interceptors: {
    request: AxiosRequestInterceptorManager<Config>;
    response: AxiosResponseInterceptorManager;
  };
  getUri(config?: Config): string;
  request<T = any, R = AxiosResponse<T>>(config: Config): Promise<R>;
  get<T = any, R = AxiosResponse<T>>(url: string, config?: Config): Promise<R>;
  delete<T = any, R = AxiosResponse<T>>(url: string, config?: Config): Promise<R>;
  head<T = any, R = AxiosResponse<T>>(url: string, config?: Config): Promise<R>;
  options<T = any, R = AxiosResponse<T>>(url: string, config?: Config): Promise<R>;
  post<T = any, R = AxiosResponse<T>>(url: string, data?: any, config?: Config): Promise<R>;
  put<T = any, R = AxiosResponse<T>>(url: string, data?: any, config?: Config): Promise<R>;
  patch<T = any, R = AxiosResponse<T>>(url: string, data?: any, config?: Config): Promise<R>;
}

export interface AxiosStatic extends AxiosInstance {
  create<C extends AxiosRequestConfig>(config?: C): AxiosInstance<C>;
  Cancel: CancelStatic;
  CancelToken: CancelTokenStatic;
  isCancel(value: any): boolean;
  all<T>(values: (T | Promise<T>)[]): Promise<T[]>;
  spread<T, R>(callback: (...args: T[]) => R): (array: T[]) => R;
}

declare const Axios: AxiosStatic;

export default Axios;
