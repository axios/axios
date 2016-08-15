// Type definitions for axios 0.9.1
// Project: https://github.com/mzabriskie/axios
// Definitions by: Marcel Buesing <https://github.com/marcelbuesing>
// Definitions: https://github.com/borisyankov/DefinitelyTyped

declare module Axios {

    interface IThenable<R> {
        then<U>(onFulfilled?: (value: R) => U | IThenable<U>, onRejected?: (error: any) => U | IThenable<U>): IThenable<U>;
        then<U>(onFulfilled?: (value: R) => U | IThenable<U>, onRejected?: (error: any) => void): IThenable<U>;
    }

    interface IPromise<R> extends IThenable<R> {
        then<U>(onFulfilled?: (value: R) => U | IThenable<U>, onRejected?: (error: any) => U | IThenable<U>): IPromise<U>;
        then<U>(onFulfilled?: (value: R) => U | IThenable<U>, onRejected?: (error: any) => void): IPromise<U>;
        catch<U>(onRejected?: (error: any) => U | IThenable<U>): IPromise<U>;
    }

    /**
     * HTTP Basic auth details
     */
    interface AxiosHttpBasicAuth {
        username: string;
        password: string;
    }

    /**
     * Common axios XHR config interface
     * <T> - request body data type
     */
    interface AxiosXHRConfigBase<T> {
        /**
         * will be prepended to `url` unless `url` is absolute.
         * It can be convenient to set `baseURL` for an instance
         * of axios to pass relative URLs to methods of that instance.
         */
        baseURL?: string;

        /**
         * custom headers to be sent
         */
        headers?: Object;

        /**
         * URL parameters to be sent with the request
         */
        params?: Object;

        /**
         * optional function in charge of serializing `params`
         * (e.g. https://www.npmjs.com/package/qs, http://api.jquery.com/jquery.param/)
         */
        paramsSerializer?: (params: Object) => string;

        /**
         * specifies the number of milliseconds before the request times out.
         * If the request takes longer than `timeout`, the request will be aborted.
         */
        timeout?: number;

        /**
         * indicates whether or not cross-site Access-Control requests
         * should be made using credentials
         */
        withCredentials?: boolean;

        /**
         * indicates that HTTP Basic auth should be used, and supplies
         * credentials. This will set an `Authorization` header,
         * overwriting any existing `Authorization` custom headers you have
         * set using `headers`.
         */
        auth?: AxiosHttpBasicAuth;

        /**
         * indicates the type of data that the server will respond with
         * options are 'arraybuffer', 'blob', 'document', 'json', 'text'
         */
        responseType?: string;

        /**
         * name of the cookie to use as a value for xsrf token
         */
        xsrfCookieName?: string;

        /**
         * name of the http header that carries the xsrf token value
         */
        xsrfHeaderName?: string;

        /**
         * Change the request data before it is sent to the server.
         * This is only applicable for request methods 'PUT', 'POST', and 'PATCH'
         * The last function in the array must return a string or an ArrayBuffer
         */
        transformRequest?: (<U>(data: T) => U) | [<U>(data: T) => U];

        /**
         * change the response data to be made before it is passed to then/catch
         */
        transformResponse?: <U>(data: T) => U;
    }

    /**
     * <T> - request body data type
     */
    interface AxiosXHRConfig<T> extends AxiosXHRConfigBase<T> {
        /**
         * server URL that will be used for the request, options are:
         * GET, PUT, POST, DELETE, CONNECT, HEAD, OPTIONS, TRACE, PATCH
         */
        url: string;

        /**
         * request method to be used when making the request
         */
        method?: string;

        /**
         * data to be sent as the request body
         * Only applicable for request methods 'PUT', 'POST', and 'PATCH'
         * When no `transformRequest` is set, must be a string, an ArrayBuffer or a hash
         */
        data?: T;
    }

    /**
     * <T> - expected response type,
     * <U> - request body data type
     */
    interface AxiosXHR<T> {
        /**
         * Response that was provided by the server
         */
        data: T;

        /**
         * HTTP status code from the server response
         */
        status: number;

        /**
         * HTTP status message from the server response
         */
        statusText: string;

        /**
         * headers that the server responded with
         */
        headers: Object;

        /**
         * config that was provided to `axios` for the request
         */
        config: AxiosXHRConfig<T>;
    }

    interface Interceptor {
        /**
         * intercept request before it is sent
         */
        request: RequestInterceptor;

        /**
         * intercept response of request when it is received.
         */
        response: ResponseInterceptor
    }

    type InterceptorId = number;

    interface RequestInterceptor {
        /**
         * <U> - request body data type
         */

        use<U>(fulfilledFn: (config: AxiosXHRConfig<U>) => AxiosXHRConfig<U>): InterceptorId;

        use<U>(fulfilledFn: (config: AxiosXHRConfig<U>) => AxiosXHRConfig<U>,
               rejectedFn: (error: any) => any)
            : InterceptorId;

        eject(interceptorId: InterceptorId): void;
    }

    interface ResponseInterceptor {
        /**
         * <T> - expected response type
         */

        use<T>(fulfilledFn: (config: Axios.AxiosXHR<T>) => Axios.AxiosXHR<T>): InterceptorId;

        use<T>(fulfilledFn: (config: Axios.AxiosXHR<T>) => Axios.AxiosXHR<T>,
               rejectedFn: (error: any) => any)
            : InterceptorId;

        eject(interceptorId: InterceptorId): void;
    }

    /**
     * <T> - expected response type,
     * <U> - request body data type
     */
    interface AxiosInstance {

        /**
         * Send request as configured
         */
        <T>(config: AxiosXHRConfig<T>): IPromise<AxiosXHR<T>>;

        /**
         * Send request as configured
         */
        new <T>(config: AxiosXHRConfig<T>): IPromise<AxiosXHR<T>>;

        /**
         * Send request as configured
         */
        request<T>(config: AxiosXHRConfig<T>): IPromise<AxiosXHR<T>>;

        /**
         * intercept requests or responses before they are handled by then or catch
         */
        interceptors: Interceptor;

        /**
         * equivalent to `Promise.all`
         */
        all<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(values: [T1 | IPromise<AxiosXHR<T1>>, T2 | IPromise<AxiosXHR<T2>>, T3 | IPromise<AxiosXHR<T3>>, T4 | IPromise<AxiosXHR<T4>>, T5 | IPromise<AxiosXHR<T5>>, T6 | IPromise<AxiosXHR<T6>>, T7 | IPromise<AxiosXHR<T7>>, T8 | IPromise<AxiosXHR<T8>>, T9 |  IPromise<AxiosXHR<T9>>, T10 |  IPromise<AxiosXHR<T10>>]): IPromise<[AxiosXHR<T1>, AxiosXHR<T2>, AxiosXHR<T3>, AxiosXHR<T4>, AxiosXHR<T5>, AxiosXHR<T6>, AxiosXHR<T7>, AxiosXHR<T8>, AxiosXHR<T9>, AxiosXHR<T10>]>;
        all<T1, T2, T3, T4, T5, T6, T7, T8, T9>(values: [T1 | IPromise<AxiosXHR<T1>>, T2 | IPromise<AxiosXHR<T2>>, T3 | IPromise<AxiosXHR<T3>>, T4 | IPromise<AxiosXHR<T4>>, T5 | IPromise<AxiosXHR<T5>>, T6 | IPromise<AxiosXHR<T6>>, T7 | IPromise<AxiosXHR<T7>>, T8 | IPromise<AxiosXHR<T8>>, T9 |  IPromise<AxiosXHR<T9>>]): IPromise<[AxiosXHR<T1>, AxiosXHR<T2>, AxiosXHR<T3>, AxiosXHR<T4>, AxiosXHR<T5>, AxiosXHR<T6>, AxiosXHR<T7>, AxiosXHR<T8>, AxiosXHR<T9>]>;
        all<T1, T2, T3, T4, T5, T6, T7, T8>(values: [T1 | IPromise<AxiosXHR<T1>>, T2 | IPromise<AxiosXHR<T2>>, T3 | IPromise<AxiosXHR<T3>>, T4 | IPromise<AxiosXHR<T4>>, T5 | IPromise<AxiosXHR<T5>>, T6 | IPromise<AxiosXHR<T6>>, T7 | IPromise<AxiosXHR<T7>>, T8 | IPromise<AxiosXHR<T8>>]): IPromise<[AxiosXHR<T1>, AxiosXHR<T2>, AxiosXHR<T3>, AxiosXHR<T4>, AxiosXHR<T5>, AxiosXHR<T6>, AxiosXHR<T7>, AxiosXHR<T8>]>;
        all<T1, T2, T3, T4, T5, T6, T7>(values: [T1 | IPromise<AxiosXHR<T1>>, T2 | IPromise<AxiosXHR<T2>>, T3 | IPromise<AxiosXHR<T3>>, T4 | IPromise<AxiosXHR<T4>>, T5 | IPromise<AxiosXHR<T5>>, T6 | IPromise<AxiosXHR<T6>>, T7 | IPromise<AxiosXHR<T7>>]): IPromise<[AxiosXHR<T1>, AxiosXHR<T2>, AxiosXHR<T3>, AxiosXHR<T4>, AxiosXHR<T5>, AxiosXHR<T6>, AxiosXHR<T7>]>;
        all<T1, T2, T3, T4, T5, T6>(values: [T1 | IPromise<AxiosXHR<T1>>, T2 | IPromise<AxiosXHR<T2>>, T3 | IPromise<AxiosXHR<T3>>, T4 | IPromise<AxiosXHR<T4>>, T5 | IPromise<AxiosXHR<T5>>, T6 | IPromise<AxiosXHR<T6>>]): IPromise<[AxiosXHR<T1>, AxiosXHR<T2>, AxiosXHR<T3>, AxiosXHR<T4>, AxiosXHR<T5>, AxiosXHR<T6>]>;
        all<T1, T2, T3, T4, T5>(values: [T1 | IPromise<AxiosXHR<T1>>, T2 | IPromise<AxiosXHR<T2>>, T3 | IPromise<AxiosXHR<T3>>, T4 | IPromise<AxiosXHR<T4>>, T5 | IPromise<AxiosXHR<T5>>]): IPromise<[AxiosXHR<T1>, AxiosXHR<T2>, AxiosXHR<T3>, AxiosXHR<T4>, AxiosXHR<T5>]>;
        all<T1, T2, T3, T4>(values: [T1 | IPromise<AxiosXHR<T1>>, T2 | IPromise<AxiosXHR<T2>>, T3 | IPromise<AxiosXHR<T3>>, T4 | IPromise<AxiosXHR<T4>>]): IPromise<[AxiosXHR<T1>, AxiosXHR<T2>, AxiosXHR<T3>, AxiosXHR<T4>]>;
        all<T1, T2, T3>(values: [T1 | IPromise<AxiosXHR<T1>>, T2 | IPromise<AxiosXHR<T2>>, T3 | IPromise<AxiosXHR<T3>>]): IPromise<[AxiosXHR<T1>, AxiosXHR<T2>, AxiosXHR<T3>]>;
        all<T1, T2>(values: [T1 | IPromise<AxiosXHR<T1>>, T2 | IPromise<AxiosXHR<T2>>]): IPromise<[AxiosXHR<T1>, AxiosXHR<T2>]>;

        /**
         * spread array parameter to `fn`.
         * note: alternative to `spread`, destructuring assignment.
         */
        spread<T1, T2, U>(fn: (t1: T1, t2: T2) => U): (arr: ([T1, T2])) =>  U;

        /**
         * convenience alias, method = GET
         */
        get<T>(url: string, config?: AxiosXHRConfigBase<T>): IPromise<AxiosXHR<T>>;


        /**
         * convenience alias, method = DELETE
         */
        delete<T>(url: string, config?: AxiosXHRConfigBase<T>): IPromise<AxiosXHR<T>>;

        /**
         * convenience alias, method = HEAD
         */
        head<T>(url: string, config?: AxiosXHRConfigBase<T>): IPromise<AxiosXHR<T>>;

        /**
         * convenience alias, method = POST
         */
        post<T>(url: string, data?: any, config?: AxiosXHRConfigBase<T>): IPromise<AxiosXHR<T>>;

        /**
         * convenience alias, method = PUT
         */
        put<T>(url: string, data?: any, config?: AxiosXHRConfigBase<T>): IPromise<AxiosXHR<T>>;

        /**
         * convenience alias, method = PATCH
         */
        patch<T>(url: string, data?: any, config?: AxiosXHRConfigBase<T>): IPromise<AxiosXHR<T>>;
    }

    /**
     * <T> - expected response type,
     */
    interface AxiosStatic extends AxiosInstance {
        /**
         * create a new instance of axios with a custom config
         */
        create<T>(config: AxiosXHRConfigBase<T>): AxiosInstance;
    }
}

declare var axios: Axios.AxiosStatic;

declare module "axios" {
    export = axios;
}
