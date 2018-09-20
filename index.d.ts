import * as http from 'http';
import * as https from 'https';

/**
 * Transform function that receives the body and headers from a
 * request or response, and returns a transformed body to be placed
 * back onto the request or response.
 * The headers may be modified.
 */
export type AxiosTransformer = (data: any, headers?: Headers) => any

/**
 * Custom adapter that receives a request config, sends a request,
 * and returns a promise that resolves with the response.
 * The adapter should use the semantics of the request config as
 * closely as possible.
 */
export type AxiosAdapter = (config: AxiosRequestConfig) => Promise<AxiosResponse>

/**
 * Basic credentials to pass in the Authorization header of the request.
 */
export interface AxiosBasicCredentials {
  username: string;
  password: string;
}

/**
 * Configuration to specify a proxy that the underlying adapter should
 * send requests to.
 */
export interface AxiosProxyConfig {
  /** Hostname of the proxy server */
  host: string;
  /** Port of the proxy server */
  port: number;
  /**
   * Optional authentication, if required by the server.
   * If specified, these are placed under the Proxy-Authorization header.
   */
  auth?: {
    username: string;
    password: string;
  };
  /** Optional protocol to use to connet to the proxy (http/https) */
  protocol?: string;
}

/**
 * Allowable HTTP methods
 */
export type Method =
  | 'get' | 'GET'
  | 'delete' | 'DELETE'
  | 'head' | 'HEAD'
  | 'options' | 'OPTIONS'
  | 'post' | 'POST'
  | 'put' | 'PUT'
  | 'patch' | 'PATCH'

/**
 * Expected response type, used by Axios to process/parse the response data.
 */
export type ResponseType = 
  | 'arraybuffer' 
  | 'blob' 
  | 'document' 
  | 'json' 
  | 'text' 
  | 'stream'

/**
 * A generic key-value object intended to be used for headers
 * or URL parameters.
 */
export interface StringKeyedObject {
  [key: string]: any;
}

/**
 * Used to configure an axios instance, or a single request.
 * Any properties specified for the instance are overridden by
 * those specified for an individual request.
 * Because of this, the instance config can be thought
 * of as a set of "defaults", and the request config specifies the
 * explicit properties to be used for that request.
 */
export interface AxiosRequestConfig<P = StringKeyedObject | URLSearchParams> {
  /**
   * The URL of the request. If this is relative, it will be
   * appended to the baseURL.
   */
  url?: string;
  /**
   * The method to use for the request (defaults to GET).
   */
  method?: Method;
  /**
   * When specified, all relative urls will be appended to it.
   * This is typically set only for the instance so that any
   * subsequent requests can use it implicitly.
   */
  baseURL?: string;
  /**
   * Optional request data transformer(s).
   * If multiple are specified, they are applied in order.
   * By default, axios will attempt to serialize the data
   * if it knows how, setting the content-type accordingly
   * if it is not already specified.
   * When this is set, this default behavior is overridden.
   */
  transformRequest?: AxiosTransformer | AxiosTransformer[];
  /**
   * Optional response data transformer(s).
   * If multiple are specified, they are applied in order.
   * By default, axios will attempt to parse the response
   * to JSON, returning the data as-is if it fails.
   * When this is set, this default behavior is overridden.
   */
  transformResponse?: AxiosTransformer | AxiosTransformer[];
  /**
   * Headers to pass in the request.
   * Axios may override some of these depending on the 
   * underlying implementation.
   */
  headers?: StringKeyedObject;
  /**
   * Parameters to be serialized into the URL query string.
   * By default, this is expected to be a plain object
   * (where the keys and values of the object correspond to the 
   * keys and values of the query string) or a URLSearchParams object.
   * However, this can be overridden using the paramsSerializer
   * property, in which case this can be overridden using
   * the P type parameter of the request config.
   */
  params?: P;
  /**
   * Use this to override the serializer used to convert the URL params
   * into a query string. If this expects an object that is not a string-keyed
   * object or URLSearchParams, override the P type parameter of the request config.
   */
  paramsSerializer?: (params: P) => string;
  /**
   * The body to pass along with the request.
   * This can be any type, but some types are handled specially:
   * - URLSearchParams are serialized and sent with a Content-Type of 'application/x-www-form-urlencoded'
   * - Objects that are not FormData or any of the various binary types (such as Buffer or Blob)
   *   are serialized as JSON.
   * All other types are left as passed, unless `transformRequest` is specified.
   * Note that the underlying implementation may reject invalid types.
   */
  data?: any;
  /**
   * Timeout (in ms) after which to reject the request with a timeout error.
   * By default this is 0, indicating no timeout.
   */
  timeout?: number;
  /**
   * This is forwarded to the underlying XMLHttpRequest.withCredentials
   * property when used in the browser, and has no effect when used in Node.
   * 
   * https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/withCredentials
   */
  withCredentials?: boolean;
  /**
   * A custom HTTP adapter to use instead of the default built-in Axios adapters.
   * This must implement the entire pipeline for processing a request config, sending
   * the request, and returning the response.
   * 
   * By default, Axios will use its own built-in adapters:
   * - In Node, the built-in 'http' adapter is used, which utilizes Node's native
   *   'http' and 'https' modules.
   * - In the browser, the built-in 'xhr' adapter is used, which utilizes the standard
   *   XMLHttpRequest API.
   */
  adapter?: AxiosAdapter;
  /**
   * Basic credentials to pass in the Authorization header.
   * If more complex authorization is required, set the Authorization header
   * manually.
   */
  auth?: AxiosBasicCredentials;
  /**
   * The expected type of the response body.
   * In the browser, this is set directly on the request object.
   * In Node, this controls how the response stream is handled.
   * If this is set to 'stream', the response stream is returned directly
   * as the response data. If it is set to 'arraybuffer', the stream is
   * read into a Buffer. Otherwise, the stream is read into a string.
   */
  responseType?: ResponseType;
  /**
   * The name of the cookie containing the XSRF token set by the server,
   * defaulting to 'XSRF-TOKEN'. This has no effect in Node.
   */
  xsrfCookieName?: string;
  /**
   * The name of the request header to set with the XSRF token,
   * defaulting to 'X-XSRF-TOKEN'. This has no effect in Node.
   */
  xsrfHeaderName?: string;
  /**
   * An event handler for progress events while the request is being sent.
   * This has no effect in Node.
   */
  onUploadProgress?: (progressEvent: ProgressEvent) => void;
  /**
   * An event handler for progress events while the response is being downloaded.
   * This has no effect in Node.
   */
  onDownloadProgress?: (progressEvent: ProgressEvent) => void;
  /**
   * The max response size allowed, in bytes. This has no effect in the browser.
   */
  maxContentLength?: number;
  /**
   * A function to determine how to handle response status codes.
   * If this function returns true for a response, the response
   * promise will resolve. If it returns false, the promise will reject.
   * By default, this will return true only for 2xx response statuses,
   * causing any non-2xx response to reject the promise.
   * If this is set to undefined, all responses will resolve.
   */
  validateStatus?: (status: number) => boolean;
  /**
   * The maximum number of redirect responses to follow before rejecting.
   * The browser will always follow redirects to an internal stopping point,
   * so this only has an effect on Node, which by default does not follow
   * redirects.
   */
  maxRedirects?: number;
  /**
   * On Node, this will specify the Unix socket path to use to create sockets.
   */
  socketPath?: string | null;
  /**
   * On Node, this will set the agent passed to requests for HTTP requests
   */
  httpAgent?: http.Agent;
  /**
   * On Node, this will set the agent passed to requests for HTTPS requests
   */
  httpsAgent?: https.Agent;
  /**
   * On Node, this will configure an HTTP proxy to send requests to instead of going
   * straight to the specified URL. If undefined, Axios will attempt to read
   * the proxy information from the standard http_proxy and https_proxy
   * environment variables.
   */
  proxy?: AxiosProxyConfig | false;
  /**
   * Cancel token to use to detect cancellation requests.
   * This should be done per-request because each cancel token
   * manages only one promise, and thus can only be used once.
   */
  cancelToken?: CancelToken;
}

/**
 * A standard response object returned from all Axios requests
 */
export interface AxiosResponse<T = any>  {
  /**
   * The decoded (and parsed if the response was valid JSON) response body.
   */
  data: T;
  /** The HTTP status code */
  status: number;
  /** The corresponding HTTP status text */
  statusText: string;
  /** The parsed headers from the response */
  headers: StringKeyedObject;
  /** The config used to send the request */
  config: AxiosRequestConfig;
  /**
   * The underlying implementation's request object, if it exists.
   * This will be an XMLHttpRequest in the browser,
   * and a http.OutgoingMessage or https.OutgoingMessage in Node.
   */
  request?: any;
}

/**
 * The type of errors thrown by a rejected request when
 * the default Axios adapter is used.
 */
export interface AxiosError extends Error {
  /** The config used to send the request */
  config: AxiosRequestConfig;
  /** An optional code provided by the underlying implementation */
  code?: string;
  /**
   * The underlying implementation's request object, if it exists.
   * This will be an XMLHttpRequest in the browser,
   * and a http.OutgoingMessage or https.OutgoingMessage in Node.
   */
  request?: any;
  /**
   * When there was a valid response and this error was created
   * as a result of an invalid status code, the response will be
   * available here.
   */
  response?: AxiosResponse;
  /**
   * Flag set on all AxiosErrors. This can be used to discriminate
   * between AxiosErrors and other errors that may be thrown.
   */
  isAxiosError: true;
}

/**
 * A simple container for a cancellation reason.
 * This is used by CancelToken.
 */
export class Cancel {
  constructor(message?: string);
  /** Optional message specifying the reason for the cancellation */
  message?: string;
}

/**
 * A function used to issue a cancellation to a CancelToken.
 * This is provided via the executor of a CancelToken or
 * CancelToken.source().
 */
export type Canceler = (message?: string) => void

/**
 * A token to attach to a request allowing requests to be aborted.
 * This is watched by the internal adapter, and will use the underlying
 * implementation to abort the request when the token's cancel function
 * is called.
 */
export class CancelToken {
  /**
   * Constructs a CancelToken using an executor, similarly
   * to a Promise's contstructor.
   * The executor is passed a cancel function that is used
   * to issue a cancellation request to the listening request.
   */
  constructor(executor: (cancel: Canceler) => void);
  /**
   * An alternative way to create a cancel token, returning
   * a token and a cancel function linked to that token.
   */
  static source(): CancelTokenSource;
  /**
   * The promise that will be resolved when the cancel function is called.
   * The resolved value is the Cancel instance containing the reason
   * for the cancellation.
   */
  promise: Promise<Cancel>;
  /**
   * Once the cancel function is called, the reason will be set here.
   */
  reason?: Cancel;
  /**
   * This will throw the Cancel instance if this token has been cancelled.
   */
  throwIfRequested(): void;
}

/** Result of calling CancelToken.source() */
export interface CancelTokenSource {
  /** A normal CancelToken instance */
  token: CancelToken;
  /** A cancel function that will cancel the above token */
  cancel: Canceler;
}

/**
 * A single fulfilled/rejected function pair inside an interceptor manager.
 */
export interface AxiosInterceptor<V> {
  fulfilled?: (value: V) => V | Promise<V>;
  rejected?: (error: any) => any;
}

/**
 * Manages a stack of interceptor functions.
 * See Axios.interceptors for more information.
 */
export interface AxiosInterceptorManager<V> {
  /**
   * Adds an interceptor to the stack containing the provided functions.
   * The unique id of this interceptor will be returned, which can be used by `eject()`.
   * @param onFulfilled A function to execute when the previous interceptor succeeds
   * @param onRejected A function to execute when the previous interceptor(s) (or this onFullfilled) fails
   */
  use(onFulfilled?: (value: V) => V | Promise<V>, onRejected?: (error: any) => any): number;
  /**
   * Removes an interceptor from this manager.
   * @param id An id returned from `use()`
   */
  eject(id: number): void;
  /**
   * Call a function for each registered interceptor.
   */
  forEach(fn: (interceptor: AxiosInterceptor<V>) => void);
}

/**
 * Config used in Axios.getUri() to generate a URI.
 */
export interface AxiosUriConfig<P = StringKeyedObject | URLSearchParams> {
  /**
   * The base path of the URI to generate, defaulting to the client's url
   * (not including the baseURL)
   */
  url?: string;
  /**
   * The query parameters to include in the URL, as an object.
   * By default, this expects either an object representing the
   * query parameters or a URLSearchParams object.
   */
  params?: P;
  /**
   * A function to override the default query parameter serializer,
   * allowing the type of the parameter object to be overridden.
   */
  paramsSerializer?: (params: P) => string;
}

/**
 * An Axios client instance
 */
export class Axios {
  /** Constructs an Axios instance using the specified config as a set of defaults */
  constructor(instanceConfig: AxiosRequestConfig);

  /** This instance's set of defaults (can be modified) */
  defaults: AxiosRequestConfig;

  /**
   * The interceptors defining this instance's request pipeline.
   * The pipeline is executed in this order:
   * 1. Each request interceptor is executed in the **reverse** order they were added.
   * 2. The request is dispatched via this instance's adapter, and the response is awaited
   *    (this is where request and response data transforms are done).
   * 3. Each response interceptor is executed in the order it was added.
   */
  interceptors: {
    /**
     * The set of request interceptors for this instance.
     * Each interceptor is called with the request config.
     */
    request: AxiosInterceptorManager<AxiosRequestConfig>;
    /**
     * The set of response interceptors for this instance.
     * Each interceptor is called with the response object.
     */
    response: AxiosInterceptorManager<AxiosResponse>;
  };

  /**
   * Generates a URI from a URL path and parameters, with an optional param serializer override
   */
  getUri<P = StringKeyedObject | URLSearchParams>(config: AxiosUriConfig<P>): string;

  /**
   * Base API to send a generic request using a request config
   */
  request<T = any, R = AxiosResponse<T>> (config: AxiosRequestConfig): Promise<R>;

  /**
   * Base API to send a generic request to the specified URL, with an optional request config
   */
  request<T = any, R = AxiosResponse<T>> (url: string, config?: AxiosRequestConfig): Promise<R>;

  /**
   * Send a GET request to the specified URL, with an optional request config
   */
  get<T = any, R = AxiosResponse<T>>(url: string, config?: AxiosRequestConfig): Promise<R>;

  /**
   * Send a DELETE request to the specified URL, with an optional request config
   */
  delete<T = any, R = AxiosResponse<T>>(url: string, config?: AxiosRequestConfig): Promise<R>;

  /**
   * Send a HEAD request to the specified URL, with an optional request config
   */
  head<T = any, R = AxiosResponse<T>>(url: string, config?: AxiosRequestConfig): Promise<R>;

  /**
   * Send a POST request to the specified URL using the specified data, with an optional request config
   */
  post<T = any, R = AxiosResponse<T>>(url: string, data?: any, config?: AxiosRequestConfig): Promise<R>;

  /**
   * Send a PUT request to the specified URL using the specified data, with an optional request config
   */
  put<T = any, R = AxiosResponse<T>>(url: string, data?: any, config?: AxiosRequestConfig): Promise<R>;

  /**
   * Send a PATCH request to the specified URL using the specified data, with an optional request config
   */
  patch<T = any, R = AxiosResponse<T>>(url: string, data?: any, config?: AxiosRequestConfig): Promise<R>;
}

/**
 * The type of Axios instances created using the `create()` function.
 * It includes all members of a regular Axios instance, and is also
 * a function that is aliased to `Axios.request()`.
 */
export interface AxiosInstance extends Axios {
  /** Alias for the `request` method */
  <T = any, R = AxiosResponse<T>>(config: AxiosRequestConfig): Promise<R>;
  /** Alias for the `request` method */
  <T = any, R = AxiosResponse<T>>(url: string, config?: AxiosRequestConfig): Promise<R>;
}

/**
 * Creates an Axios instance using an optional default config.
 * The resulting instance is also a function
 */
export function create(config?: AxiosRequestConfig): AxiosInstance;

/**
 * Returns true if the value is a Cancel instance
 */
export function isCancel(value: any): value is Cancel;

// TODO: type this properly so that it handles tuple types instead of array types
/**
 * Alias for Promise.all()
 */
export function all<T>(values: Array<T | Promise<T>>): Promise<T[]>;

/**
 * Utility that takes a function with spread arguments and allows it to be used after `all()`:
 * 
 * ```typescript
 * axios.all([a, b, c]).then(axios.spread((a, b, c) => ...));
 * ```
 */
export function spread<T extends any[], R>(callback: (...args: T) => R): (array: T) => R;

declare const axios: AxiosInstance;
export default axios;
