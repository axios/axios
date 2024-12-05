// TypeScript Version: 4.1
type HeaderValue = string | string[] | number | boolean;

type AxiosHeaders = Record<string, HeaderValue | Record<Method & CommonHeaders, HeaderValue>>;

type MethodsHeaders = {
  [Key in Method as Lowercase<Key>]: AxiosHeaders;
};

interface CommonHeaders  {
  common: AxiosHeaders;
}

export type AxiosRequestHeaders = Partial<AxiosHeaders & MethodsHeaders & CommonHeaders>;

export type AxiosResponseHeaders = Partial<Record<string, string>> & {
  "set-cookie"?: string[]
};

export interface AxiosRequestTransformer {
  (data: any, headers: AxiosRequestHeaders): any;
}

export interface AxiosResponseTransformer {
  (data: any, headers?: AxiosResponseHeaders, status?: number): any;
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
  auth?: {
    username: string;
    password: string;
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
  | 'unlink' | 'UNLINK';

export type ResponseType =
  | 'arraybuffer'
  | 'blob'
  | 'document'
  | 'json'
  | 'text'
  | 'stream';

  export type responseEncoding =
  | 'ascii' | 'ASCII'
  | 'ansi' | 'ANSI'
  | 'binary' | 'BINARY'
  | 'base64' | 'BASE64'
  | 'base64url' | 'BASE64URL'
  | 'hex' | 'HEX'
  | 'latin1' | 'LATIN1'
  | 'ucs-2' | 'UCS-2'
  | 'ucs2' | 'UCS2'
  | 'utf-8' | 'UTF-8'
  | 'utf8' | 'UTF8'
  | 'utf16le' | 'UTF16LE';

export interface TransitionalOptions {
  silentJSONParsing?: boolean;
  forcedJSONParsing?: boolean;
  clarifyTimeoutError?: boolean;
}

export interface GenericAbortSignal {
  aborted: boolean;
  onabort: ((...args: any) => any) | null;
  addEventListener: (...args: any) => any;
  removeEventListener: (...args: any) => any;
}

export interface FormDataVisitorHelpers {
  defaultVisitor: SerializerVisitor;
  convertValue: (value: any) => any;
  isVisitable: (value: any) => boolean;
}

export interface SerializerVisitor {
  (
      this: GenericFormData,
      value: any,
      key: string | number,
      path: null | Array<string | number>,
      helpers: FormDataVisitorHelpers
  ): boolean;
}

export interface SerializerOptions {
  visitor?: SerializerVisitor;
  dots?: boolean;
  metaTokens?: boolean;
  indexes?: boolean | null;
}

// tslint:disable-next-line
export interface FormSerializerOptions extends SerializerOptions {
}

export interface ParamEncoder {
  (value: any, defaultEncoder: (value: any) => any): any;
}

export interface CustomParamsSerializer {
  (params: Record<string, any>, options?: ParamsSerializerOptions): string;
}

export interface ParamsSerializerOptions extends SerializerOptions {
  encode?: ParamEncoder;
  serialize?: CustomParamsSerializer;
}

export interface AxiosRequestConfig<D = any> {
  url?: string;
  method?: Method | string;
  baseURL?: string;
  transformRequest?: AxiosRequestTransformer | AxiosRequestTransformer[];
  transformResponse?: AxiosResponseTransformer | AxiosResponseTransformer[];
  headers?: AxiosRequestHeaders;
  params?: any;
  paramsSerializer?: ParamsSerializerOptions | CustomParamsSerializer;
  data?: D;
  timeout?: number;
  timeoutErrorMessage?: string;
  withCredentials?: boolean;
  adapter?: AxiosAdapter;
  auth?: AxiosBasicCredentials;
  responseType?: ResponseType;
  responseEncoding?: responseEncoding | string;
  xsrfCookieName?: string;
  xsrfHeaderName?: string;
  onUploadProgress?: (progressEvent: ProgressEvent) => void;
  onDownloadProgress?: (progressEvent: ProgressEvent) => void;
  maxContentLength?: number;
  validateStatus?: ((status: number) => boolean) | null;
  maxBodyLength?: number;
  maxRedirects?: number;
  beforeRedirect?: (options: Record<string, any>, responseDetails: {headers: Record<string, string>}) => void;
  socketPath?: string | null;
  httpAgent?: any;
  httpsAgent?: any;
  proxy?: AxiosProxyConfig | false;
  cancelToken?: CancelToken;
  decompress?: boolean;
  transitional?: TransitionalOptions;
  signal?: GenericAbortSignal;
  insecureHTTPParser?: boolean;
  env?: {
    FormData?: new (...args: any[]) => object;
  };
  formSerializer?: FormSerializerOptions;
  withXSRFToken?: boolean | ((config: AxiosRequestConfig) => boolean | undefined);
}

export interface HeadersDefaults {
  common: AxiosRequestHeaders;
  delete: AxiosRequestHeaders;
  get: AxiosRequestHeaders;
  head: AxiosRequestHeaders;
  post: AxiosRequestHeaders;
  put: AxiosRequestHeaders;
  patch: AxiosRequestHeaders;
  options?: AxiosRequestHeaders;
  purge?: AxiosRequestHeaders;
  link?: AxiosRequestHeaders;
  unlink?: AxiosRequestHeaders;
}

export interface AxiosDefaults<D = any> extends Omit<AxiosRequestConfig<D>, 'headers'> {
  headers: HeadersDefaults;
}

export interface CreateAxiosDefaults<D = any> extends Omit<AxiosRequestConfig<D>, 'headers'> {
  headers?: AxiosRequestHeaders | Partial<HeadersDefaults>;
}

export interface AxiosResponse<T = any, D = any>  {
  data: T;
  status: number;
  statusText: string;
  headers: AxiosResponseHeaders;
  config: AxiosRequestConfig<D>;
  request?: any;
}

export class AxiosError<T = unknown, D = any> extends Error {
  constructor(
    message?: string,
    code?: string,
    config?: AxiosRequestConfig<D>,
    request?: any,
    response?: AxiosResponse<T, D>
  );

  config?: AxiosRequestConfig<D>;
  code?: string;
  request?: any;
  response?: AxiosResponse<T, D>;
  isAxiosError: boolean;
  status?: number;
  toJSON: () => object;
  cause?: Error;
  static readonly ERR_FR_TOO_MANY_REDIRECTS = "ERR_FR_TOO_MANY_REDIRECTS";
  static readonly ERR_BAD_OPTION_VALUE = "ERR_BAD_OPTION_VALUE";
  static readonly ERR_BAD_OPTION = "ERR_BAD_OPTION";
  static readonly ERR_NETWORK = "ERR_NETWORK";
  static readonly ERR_DEPRECATED = "ERR_DEPRECATED";
  static readonly ERR_BAD_RESPONSE = "ERR_BAD_RESPONSE";
  static readonly ERR_BAD_REQUEST = "ERR_BAD_REQUEST";
  static readonly ERR_NOT_SUPPORT = "ERR_NOT_SUPPORT";
  static readonly ERR_INVALID_URL = "ERR_INVALID_URL";
  static readonly ERR_CANCELED = "ERR_CANCELED";
  static readonly ECONNABORTED = "ECONNABORTED";
  static readonly ETIMEDOUT = "ETIMEDOUT";
}

export class CanceledError<T> extends AxiosError<T> {
}

export type AxiosPromise<T = any> = Promise<AxiosResponse<T>>;

export interface CancelStatic {
  new (message?: string): Cancel;
}

export interface Cancel {
  message: string | undefined;
}

export interface Canceler {
  (message?: string, config?: AxiosRequestConfig, request?: any): void;
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

export interface AxiosInterceptorOptions {
  synchronous?: boolean;
  runWhen?: (config: AxiosRequestConfig) => boolean;
}

export interface AxiosInterceptorManager<V> {
  use<T = V>(onFulfilled?: (value: V) => T | Promise<T>, onRejected?: (error: any) => any, options?: AxiosInterceptorOptions): number;
  eject(id: number): void;
}

export class Axios {
  constructor(config?: AxiosRequestConfig);
  defaults: AxiosDefaults;
  interceptors: {
    request: AxiosInterceptorManager<AxiosRequestConfig>;
    response: AxiosInterceptorManager<AxiosResponse>;
  };
  getUri(config?: AxiosRequestConfig): string;
  request<T = any, R = AxiosResponse<T>, D = any>(config: AxiosRequestConfig<D>): Promise<R>;
  get<T = any, R = AxiosResponse<T>, D = any>(url: string, config?: AxiosRequestConfig<D>): Promise<R>;
  delete<T = any, R = AxiosResponse<T>, D = any>(url: string, config?: AxiosRequestConfig<D>): Promise<R>;
  head<T = any, R = AxiosResponse<T>, D = any>(url: string, config?: AxiosRequestConfig<D>): Promise<R>;
  options<T = any, R = AxiosResponse<T>, D = any>(url: string, config?: AxiosRequestConfig<D>): Promise<R>;
  post<T = any, R = AxiosResponse<T>, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<R>;
  put<T = any, R = AxiosResponse<T>, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<R>;
  patch<T = any, R = AxiosResponse<T>, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<R>;
  postForm<T = any, R = AxiosResponse<T>, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<R>;
  putForm<T = any, R = AxiosResponse<T>, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<R>;
  patchForm<T = any, R = AxiosResponse<T>, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<R>;
}

export interface AxiosInstance extends Axios {
  <T = any, R = AxiosResponse<T>, D = any>(config: AxiosRequestConfig<D>): AxiosPromise<R>;
  <T = any, R = AxiosResponse<T>, D = any>(url: string, config?: AxiosRequestConfig<D>): AxiosPromise<R>;

  defaults: Omit<AxiosDefaults, 'headers'> & {
    headers: HeadersDefaults & {
      [key: string]: string | number | boolean | undefined
    }
  };
}

export interface GenericFormData {
  append(name: string, value: any, options?: any): any;
}

export interface GenericHTMLFormElement {
  name: string;
  method: string;
  submit(): void;
}

export interface AxiosStatic extends AxiosInstance {
  create(config?: CreateAxiosDefaults): AxiosInstance;
  Cancel: CancelStatic;
  CancelToken: CancelTokenStatic;
  Axios: typeof Axios;
  AxiosError: typeof AxiosError;
  readonly VERSION: string;
  isCancel(value: any): value is Cancel;
  all<T>(values: Array<T | Promise<T>>): Promise<T[]>;
  spread<T, R>(callback: (...args: T[]) => R): (array: T[]) => R;
  isAxiosError<T = any, D = any>(payload: any): payload is AxiosError<T, D>;
  toFormData(sourceObj: object, targetFormData?: GenericFormData, options?: FormSerializerOptions): GenericFormData;
  formToJSON(form: GenericFormData|GenericHTMLFormElement): object;
}

declare const axios: AxiosStatic;

export default axios;
