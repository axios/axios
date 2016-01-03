// Type definitions for Axios v0.8.1
// Project: https://github.com/mzabriskie/axios



declare var axios: axios.AxiosStatic

declare module axios {
  interface AxiosRequestMethods {
    get(url: string, config?: any): axios.Promise;
    delete(url: string, config?: any): axios.Promise;
    head(url: string, config?: any): axios.Promise;
    post(url: string, data: any, config?: any): axios.Promise;
    put(url: string, data: any, config?: any): axios.Promise;
    patch(url: string, data: any, config?: any): axios.Promise;
  }

  interface AxiosStatic extends AxiosRequestMethods {
    (options: axios.RequestOptions): axios.Promise;
    create(defaultOptions?: axios.InstanceOptions): AxiosInstance;
    all(iterable: any): axios.Promise;
    spread(callback: any): axios.Promise;
  }

  interface AxiosInstance extends AxiosRequestMethods  {
    request(options: axios.RequestOptions): axios.Promise;
  }

  interface Response {
    data?: any;
    status?: number;
    statusText?: string;
    headers?: any;
    config?: any;
  }

  interface Promise {
    then(onFulfilled:(response: axios.Response) => void): axios.Promise;
    catch(onRejected:(response: axios.Response) => void): axios.Promise;
  }

  interface InstanceOptions {
    transformRequest?: (data: any) => any;
    transformResponse?: (data: any) => any;
    headers?: any;
    timeout?: number;
    withCredentials?: boolean;
    responseType?: string;
    xsrfCookieName?: string;
    xsrfHeaderName?: string;
    paramsSerializer?: (params: any) => string;
    baseURL?: string;
  }

  interface RequestOptions extends InstanceOptions {
    url: string;
    method?: string;
    params?: any;
    data?: any;
  }
}

declare module "axios" {
  export = axios;
}
