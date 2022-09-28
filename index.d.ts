// TypeScript Version: 4.1
type AxiosHeaders = Record<string, string | string[] | number | boolean>;

type MethodsHeaders = {
  [Key in axios.Method as Lowercase<Key>]: AxiosHeaders;
};

interface CommonHeaders  {
  common: AxiosHeaders;
}

declare class AxiosError_<T = unknown, D = any> extends Error {
  constructor(
    message?: string,
    code?: string,
    config?: axios.AxiosRequestConfig<D>,
    request?: any,
    response?: axios.AxiosResponse<T, D>
  );

  config?: axios.AxiosRequestConfig<D>;
  code?: string;
  request?: any;
  response?: axios.AxiosResponse<T, D>;
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

declare class CanceledError_<T> extends AxiosError_<T> {
}

declare class Axios_ {
  constructor(config?: axios.AxiosRequestConfig);
  defaults: axios.AxiosDefaults;
  interceptors: {
    request: axios.AxiosInterceptorManager<axios.AxiosRequestConfig>;
    response: axios.AxiosInterceptorManager<axios.AxiosResponse>;
  };
  getUri(config?: axios.AxiosRequestConfig): string;
  request<T = any, R = axios.AxiosResponse<T>, D = any>(config: axios.AxiosRequestConfig<D>): Promise<R>;
  get<T = any, R = axios.AxiosResponse<T>, D = any>(url: string, config?: axios.AxiosRequestConfig<D>): Promise<R>;
  delete<T = any, R = axios.AxiosResponse<T>, D = any>(url: string, config?: axios.AxiosRequestConfig<D>): Promise<R>;
  head<T = any, R = axios.AxiosResponse<T>, D = any>(url: string, config?: axios.AxiosRequestConfig<D>): Promise<R>;
  options<T = any, R = axios.AxiosResponse<T>, D = any>(url: string, config?: axios.AxiosRequestConfig<D>): Promise<R>;
  post<T = any, R = axios.AxiosResponse<T>, D = any>(url: string, data?: D, config?: axios.AxiosRequestConfig<D>): Promise<R>;
  put<T = any, R = axios.AxiosResponse<T>, D = any>(url: string, data?: D, config?: axios.AxiosRequestConfig<D>): Promise<R>;
  patch<T = any, R = axios.AxiosResponse<T>, D = any>(url: string, data?: D, config?: axios.AxiosRequestConfig<D>): Promise<R>;
  postForm<T = any, R = axios.AxiosResponse<T>, D = any>(url: string, data?: D, config?: axios.AxiosRequestConfig<D>): Promise<R>;
  putForm<T = any, R = axios.AxiosResponse<T>, D = any>(url: string, data?: D, config?: axios.AxiosRequestConfig<D>): Promise<R>;
  patchForm<T = any, R = axios.AxiosResponse<T>, D = any>(url: string, data?: D, config?: axios.AxiosRequestConfig<D>): Promise<R>;
}

declare namespace axios {
  type AxiosRequestHeaders = Partial<AxiosHeaders & MethodsHeaders & CommonHeaders>;

  type AxiosResponseHeaders = Record<string, string> & {
    "set-cookie"?: string[]
  };

  interface AxiosRequestTransformer {
    (data: any, headers: AxiosRequestHeaders): any;
  }

  interface AxiosResponseTransformer {
    (data: any, headers?: AxiosResponseHeaders, status?: number): any;
  }

  interface AxiosAdapter {
    (config: AxiosRequestConfig): AxiosPromise;
  }

  interface AxiosBasicCredentials {
    username: string;
    password: string;
  }

  interface AxiosProxyConfig {
    host: string;
    port: number;
    auth?: {
      username: string;
      password: string;
    };
    protocol?: string;
  }

  type Method =
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

  type ResponseType =
    | 'arraybuffer'
    | 'blob'
    | 'document'
    | 'json'
    | 'text'
    | 'stream';

  type responseEncoding =
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

  interface TransitionalOptions {
    silentJSONParsing?: boolean;
    forcedJSONParsing?: boolean;
    clarifyTimeoutError?: boolean;
  }

  interface GenericAbortSignal {
    aborted: boolean;
    onabort: ((...args: any) => any) | null;
    addEventListener: (...args: any) => any;
    removeEventListener: (...args: any) => any;
  }

  interface FormDataVisitorHelpers {
    defaultVisitor: SerializerVisitor;
    convertValue: (value: any) => any;
    isVisitable: (value: any) => boolean;
  }

  interface SerializerVisitor {
    (
        this: GenericFormData,
        value: any,
        key: string | number,
        path: null | Array<string | number>,
        helpers: FormDataVisitorHelpers
    ): boolean;
  }

  interface SerializerOptions {
    visitor?: SerializerVisitor;
    dots?: boolean;
    metaTokens?: boolean;
    indexes?: boolean;
  }

  // tslint:disable-next-line
  interface FormSerializerOptions extends SerializerOptions {
  }

  interface ParamEncoder {
    (value: any, defaultEncoder: (value: any) => any): any;
  }

  interface ParamsSerializerOptions extends SerializerOptions {
    encode?: ParamEncoder;
  }

  interface AxiosRequestConfig<D = any> {
    url?: string;
    method?: Method | string;
    baseURL?: string;
    transformRequest?: AxiosRequestTransformer | AxiosRequestTransformer[];
    transformResponse?: AxiosResponseTransformer | AxiosResponseTransformer[];
    headers?: AxiosRequestHeaders;
    params?: any;
    paramsSerializer?: ParamsSerializerOptions;
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
  }

  interface HeadersDefaults {
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

  interface AxiosDefaults<D = any> extends Omit<AxiosRequestConfig<D>, 'headers'> {
    headers: HeadersDefaults;
  }

  interface CreateAxiosDefaults<D = any> extends Omit<AxiosRequestConfig<D>, 'headers'> {
    headers?: AxiosRequestHeaders | Partial<HeadersDefaults>;
  }

  interface AxiosResponse<T = any, D = any>  {
    data: T;
    status: number;
    statusText: string;
    headers: AxiosResponseHeaders;
    config: AxiosRequestConfig<D>;
    request?: any;
  }

  type AxiosPromise<T = any> = Promise<AxiosResponse<T>>;

  interface CancelStatic {
    new (message?: string): Cancel;
  }

  interface Cancel {
    message: string | undefined;
  }

  interface Canceler {
    (message?: string, config?: AxiosRequestConfig, request?: any): void;
  }

  interface CancelTokenStatic {
    new (executor: (cancel: Canceler) => void): CancelToken;
    source(): CancelTokenSource;
  }

  interface CancelToken {
    promise: Promise<Cancel>;
    reason?: Cancel;
    throwIfRequested(): void;
  }

  interface CancelTokenSource {
    token: CancelToken;
    cancel: Canceler;
  }

  interface AxiosInterceptorOptions {
    synchronous?: boolean;
    runWhen?: (config: AxiosRequestConfig) => boolean;
  }

  interface AxiosInterceptorManager<V> {
    use<T = V>(onFulfilled?: (value: V) => T | Promise<T>, onRejected?: (error: any) => any, options?: AxiosInterceptorOptions): number;
    eject(id: number): void;
  }

  interface AxiosInstance extends Axios {
    <T = any, R = AxiosResponse<T>, D = any>(config: AxiosRequestConfig<D>): AxiosPromise<R>;
    <T = any, R = AxiosResponse<T>, D = any>(url: string, config?: AxiosRequestConfig<D>): AxiosPromise<R>;

    defaults: Omit<AxiosDefaults, 'headers'> & {
      headers: HeadersDefaults & {
        [key: string]: string | number | boolean | undefined
      }
    };
  }

  interface GenericFormData {
    append(name: string, value: any, options?: any): any;
  }

  interface GenericHTMLFormElement {
    name: string;
    method: string;
    submit(): void;
  }

  type Axios = Axios_;
  type AxiosError<T = unknown, D = any> = AxiosError_<T, D>;
  type CanceledError<T> = CanceledError_<T>;

  interface AxiosStatic extends AxiosInstance {
    create(config?: CreateAxiosDefaults): AxiosInstance;
    Cancel: CancelStatic;
    CancelToken: CancelTokenStatic;
    Axios: typeof Axios_;
    AxiosError: typeof AxiosError_;
    CanceledError: typeof CanceledError_;
    readonly VERSION: string;
    isCancel(value: any): value is Cancel;
    all<T>(values: Array<T | Promise<T>>): Promise<T[]>;
    spread<T, R>(callback: (...args: T[]) => R): (array: T[]) => R;
    isAxiosError<T = any, D = any>(payload: any): payload is AxiosError<T, D>;
    toFormData(sourceObj: object, targetFormData?: GenericFormData, options?: FormSerializerOptions): GenericFormData;
    formToJSON(form: GenericFormData|GenericHTMLFormElement): object;
  }
}

declare const axios: axios.AxiosStatic;

export = axios;
