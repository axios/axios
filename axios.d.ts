// Type definitions for Axios v0.4.1
// Project: https://github.com/mzabriskie/axios



declare var axios: axios.AxiosStatic

declare module axios {
  interface AxiosStatic {
    (options: axios.RequestOptions): axios.Promise;
    get(url: string, config?: any): axios.Promise;
    delete(url: string, config?: any): axios.Promise;
    head(url: string, config?: any): axios.Promise;
    post(url: string, data: any, config?: any): axios.Promise;
    put(url: string, data: any, config?: any): axios.Promise;
    patch(url: string, data: any, config?: any): axios.Promise;
    all(iterable: any): axios.Promise;
    spread(callback: any): axios.Promise;
  }
  
  interface Response {
    data?: any;
    status?: number;
    headers?: any;
    config?: any;
  }

  interface Promise {
    then(response: axios.Response): axios.Promise;
    catch(response: axios.Response): axios.Promise;
  }

  interface RequestOptions {
    url: string;
    method?: string;
    transformRequest?: (data: any) => any;
    headers?: any;
    params?: any;
    data?: any;
    withCredentials?: boolean;
    responseType?: string;
    xsrfCookieName?: string;
    xsrfHeaderName?: string;
  }
}

declare module "axios" {
  export = axios;
}
