import axios, { AxiosRequestConfig, AxiosResponse, AxiosInstance, AxiosAdapter } from '../../';
import { Promise } from 'es6-promise';

axios.get('/user?ID=12345')
  .then(function (response) {
    console.log(response);
  })
  .catch(function (response) {
    console.log(response);
  });

axios.get('/user', {
    params: {
      ID: 12345
    }
  })
  .then(function (response) {
    console.log(response);
  })
  .catch(function (response) {
    console.log(response);
  });

axios.head('/user', {
    params: {
      ID: 12345
    }
  })
  .then(function (response) {
    console.log(response);
  })
  .catch(function (response) {
    console.log(response);
  });

axios.delete('/user', {
    params: {
      ID: 12345
    }
  })
  .then(function (response) {
    console.log(response);
  })
  .catch(function (response) {
    console.log(response);
  });

axios.post('/user', {
    firstName: 'Fred',
    lastName: 'Flintstone'
  })
  .then(function (response) {
    console.log(response);
  })
  .catch(function (response) {
    console.log(response);
  });

axios.put('/user', {
    firstName: 'Fred',
    lastName: 'Flintstone'
  })
  .then(function (response) {
    console.log(response);
  })
  .catch(function (response) {
    console.log(response);
  });

axios.patch('/user', {
    firstName: 'Fred',
    lastName: 'Flintstone'
  })
  .then(function (response) {
    console.log(response.data);
    console.log(response.status + 324);
    console.log(response.headers);
    console.log(response.config);
  })
  .catch(function (response) {
    console.log(response);
  });

axios({
  method: 'get',
  url: '/user/12345'
});

axios({
  method: 'get',
  url: '/user/12345',
  transformRequest: (data) => {
    return data.doSomething();
  }
});

axios({
  url: "hi",
  headers: {'X-Requested-With': 'XMLHttpRequest'},
  params: {
    ID: 12345
  },
  data: {
    firstName: 'Fred'
  },
  withCredentials: false, // default
  responseType: 'json', // default
  xsrfCookieName: 'XSRF-TOKEN', // default
  xsrfHeaderName: 'X-XSRF-TOKEN' // default
});

var instance = axios.create();

axios.create({
  transformRequest: (data) => {
    return data.doSomething();
  },
  transformResponse: (data) => {
    return data.doSomethingElse();
  },
  headers: {'X-Requested-With': 'XMLHttpRequest'},
  timeout: 1000,
  withCredentials: false, // default
  responseType: 'json', // default
  xsrfCookieName: 'XSRF-TOKEN', // default
  xsrfHeaderName: 'X-XSRF-TOKEN' // default
});

instance.request({
    method: 'get',
    url: '/user/12345'
  })
  .then(function (response) {
    console.log(response);
  })
  .catch(function (response) {
    console.log(response);
  });

instance.get('/user?ID=12345')
  .then(function (response) {
    console.log(response);
  })
  .catch(function (response) {
    console.log(response);
  });

instance.get('/user', {
    params: {
      ID: 12345
    }
  })
  .then(function (response) {
    console.log(response);
  })
  .catch(function (response) {
    console.log(response);
  });

// Interceptors

const requestInterceptorId: number = axios.interceptors.request.use(
  (config: AxiosRequestConfig) => config,
  (error: any) => Promise.reject(error)
);

axios.interceptors.request.eject(requestInterceptorId);

axios.interceptors.request.use(
  (config: AxiosRequestConfig) => Promise.resolve(config),
  (error: any) => Promise.reject(error)
);

axios.interceptors.request.use((config: AxiosRequestConfig) => config);
axios.interceptors.request.use((config: AxiosRequestConfig) => Promise.resolve(config));

const responseInterceptorId: number = axios.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: any) => Promise.reject(error)
);

axios.interceptors.response.eject(responseInterceptorId);

axios.interceptors.response.use(
  (response: AxiosResponse) => Promise.resolve(response),
  (error: any) => Promise.reject(error)
);

axios.interceptors.response.use((response: AxiosResponse) => response);
axios.interceptors.response.use((response: AxiosResponse) => Promise.resolve(response));

// Adapters

const adapter: AxiosAdapter = (config: AxiosRequestConfig) => {
  const response: AxiosResponse = {
    data: 'foo',
    status: 200,
    statusText: 'OK',
    headers: { 'X-FOO': 'bar' },
    config: config,
  };
  return Promise.resolve(response);
};

axios.defaults.adapter = adapter;

// axios.all

const promises = [
  Promise.resolve(1),
  Promise.resolve(2)
];

const promise: Promise<number[]> = axios.all(promises);

// axios.spread

const fn1 = (a: number, b: number, c: number) => `${a}-${b}-${c}`;
const fn2: (arr: number[]) => string = axios.spread(fn1);
