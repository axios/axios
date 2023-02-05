import axios, {
  InternalAxiosRequestConfig,
  AxiosRequestConfig,
  AxiosHeaders,
  AxiosRequestHeaders,
  AxiosResponseHeaders,
  RawAxiosRequestHeaders,
  AxiosResponse,
  AxiosError,
  AxiosInstance,
  AxiosAdapter,
  Cancel,
  CancelTokenSource,
  Canceler,
  AxiosProgressEvent,
  ParamsSerializerOptions,
  toFormData,
  formToJSON,
  all,
  isCancel,
  isAxiosError,
  spread
} from 'axios';

const config: AxiosRequestConfig = {
  url: '/user',
  method: 'get',
  baseURL: 'https://api.example.com/',
  transformRequest: (data: any) => '{"foo":"bar"}',
  transformResponse: [
    (data: any) => ({ baz: 'qux' })
  ],
  headers: { 'X-FOO': 'bar' },
  params: { id: 12345 },
  paramsSerializer: {
    indexes: true,
    encode: (value: any) => value,
    serialize: (value: Record<string, any>, options?: ParamsSerializerOptions) => String(value)
  },
  data: { foo: 'bar' },
  timeout: 10000,
  withCredentials: true,
  auth: {
    username: 'janedoe',
    password: 's00pers3cret'
  },
  responseType: 'json',
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  onUploadProgress: (progressEvent: AxiosProgressEvent) => {},
  onDownloadProgress: (progressEvent: AxiosProgressEvent) => {},
  maxContentLength: 2000,
  maxBodyLength: 2000,
  validateStatus: (status: number) => status >= 200 && status < 300,
  maxRedirects: 5,
  proxy: {
    host: '127.0.0.1',
    port: 9000
  },
  cancelToken: new axios.CancelToken((cancel: Canceler) => {})
};

const nullValidateStatusConfig: AxiosRequestConfig = {
  validateStatus: null
};

const undefinedValidateStatusConfig: AxiosRequestConfig = {
  validateStatus: undefined
};

const handleResponse = (response: AxiosResponse) => {
  console.log(response.data);
  console.log(response.status);
  console.log(response.statusText);
  console.log(response.headers);
  console.log(response.config);
};

const handleError = (error: AxiosError) => {
  if (error.response) {
    console.log(error.response.data);
    console.log(error.response.status);
    console.log(error.response.headers);
  } else {
    console.log(error.message);
  }
};

axios(config)
    .then(handleResponse)
    .catch(handleError);

axios.get('/user?id=12345')
    .then(handleResponse)
    .catch(handleError);

axios.get('/user', { params: { id: 12345 } })
    .then(handleResponse)
    .catch(handleError);

axios.head('/user')
    .then(handleResponse)
    .catch(handleError);

axios.options('/user')
    .then(handleResponse)
    .catch(handleError);

axios.delete('/user')
    .then(handleResponse)
    .catch(handleError);

axios.post('/user', { foo: 'bar' })
    .then(handleResponse)
    .catch(handleError);

axios.post('/user', { foo: 'bar' }, { headers: { 'X-FOO': 'bar' } })
    .then(handleResponse)
    .catch(handleError);

axios.put('/user', { foo: 'bar' })
    .then(handleResponse)
    .catch(handleError);

axios.patch('/user', { foo: 'bar' })
    .then(handleResponse)
    .catch(handleError);

// Typed methods
interface UserCreationDef {
  name: string;
}

interface User {
  id: number;
  name: string;
}

// with default AxiosResponse<T> result

const handleUserResponse = (response: AxiosResponse<User>) => {
  console.log(response.data.id);
  console.log(response.data.name);
  console.log(response.status);
  console.log(response.statusText);
  console.log(response.headers);
  console.log(response.config);
};

axios.get<User>('/user?id=12345')
    .then(handleUserResponse)
    .catch(handleError);

axios.get<User>('/user', { params: { id: 12345 } })
    .then(handleUserResponse)
    .catch(handleError);

axios.head<User>('/user')
    .then(handleUserResponse)
    .catch(handleError);

axios.options<User>('/user')
    .then(handleUserResponse)
    .catch(handleError);

axios.delete<User>('/user')
    .then(handleUserResponse)
    .catch(handleError);

axios.post<User>('/user', { name: 'foo', id: 1 })
    .then(handleUserResponse)
    .catch(handleError);

axios.post<User>('/user', { name: 'foo', id: 1 }, { headers: { 'X-FOO': 'bar' } })
    .then(handleUserResponse)
    .catch(handleError);

axios.put<User>('/user', { name: 'foo', id: 1 })
    .then(handleUserResponse)
    .catch(handleError);

axios.patch<User>('/user', { name: 'foo', id: 1 })
    .then(handleUserResponse)
    .catch(handleError);

// (Typed methods) with custom response type

const handleStringResponse = (response: string) => {
  console.log(response);
};

axios.get<User, string>('/user?id=12345')
    .then(handleStringResponse)
    .catch(handleError);

axios.get<User, string>('/user', { params: { id: 12345 } })
    .then(handleStringResponse)
    .catch(handleError);

axios.head<User, string>('/user')
    .then(handleStringResponse)
    .catch(handleError);

axios.options<User, string>('/user')
    .then(handleStringResponse)
    .catch(handleError);

axios.delete<User, string>('/user')
    .then(handleStringResponse)
    .catch(handleError);

axios.post<Partial<UserCreationDef>, string>('/user', { name: 'foo' })
    .then(handleStringResponse)
    .catch(handleError);

axios.post<Partial<UserCreationDef>, string>('/user', { name: 'foo' }, { headers: { 'X-FOO': 'bar' } })
    .then(handleStringResponse)
    .catch(handleError);

axios.put<Partial<UserCreationDef>, string>('/user', { name: 'foo' })
    .then(handleStringResponse)
    .catch(handleError);

axios.patch<Partial<UserCreationDef>, string>('/user', { name: 'foo' })
    .then(handleStringResponse)
    .catch(handleError);

axios.request<User, string>({
  method: 'get',
  url: '/user?id=12345'
})
    .then(handleStringResponse)
    .catch(handleError);

// Instances

const instance1: AxiosInstance = axios.create();
const instance2: AxiosInstance = axios.create(config);

instance1(config)
    .then(handleResponse)
    .catch(handleError);

instance1.request(config)
    .then(handleResponse)
    .catch(handleError);

instance1.get('/user?id=12345')
    .then(handleResponse)
    .catch(handleError);

instance1.options('/user')
    .then(handleResponse)
    .catch(handleError);

instance1.get('/user', { params: { id: 12345 } })
    .then(handleResponse)
    .catch(handleError);

instance1.post('/user', { foo: 'bar' })
    .then(handleResponse)
    .catch(handleError);

instance1.post('/user', { foo: 'bar' }, { headers: { 'X-FOO': 'bar' } })
    .then(handleResponse)
    .catch(handleError);

// Defaults

axios.defaults.headers['X-FOO'];

axios.defaults.baseURL = 'https://api.example.com/';
axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.headers.post['X-FOO'] = 'bar';
axios.defaults.timeout = 2500;

instance1.defaults.baseURL = 'https://api.example.com/';
instance1.defaults.headers.common['Accept'] = 'application/json';
instance1.defaults.headers.post['X-FOO'] = 'bar';
instance1.defaults.timeout = 2500;

// axios create defaults

axios.create({ headers: { foo: 'bar' } });
axios.create({ headers: { common: { foo: 'bar' } } });
axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
  formSerializer: {
    indexes: null,
  },
  paramsSerializer: {
    indexes: null,
  },
});

// Interceptors

const requestInterceptorId: number = axios.interceptors.request.use(
    async (config) => {
      await axios.get('/foo', {
        headers: config.headers
      });
      return config;
    },
    (error: any) => Promise.reject(error),
    {synchronous: false}
);

axios.interceptors.request.eject(requestInterceptorId);

axios.interceptors.request.use(
    (config) => Promise.resolve(config),
    (error: any) => Promise.reject(error)
);

axios.interceptors.request.use((config) => config);
axios.interceptors.request.use((config) => Promise.resolve(config));

const responseInterceptorId: number = axios.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: any) => Promise.reject(error)
);

axios.interceptors.response.eject(responseInterceptorId);

axios.interceptors.response.use(
    (response: AxiosResponse) => Promise.resolve(response),
    (error: any) => Promise.reject(error)
);

axios.interceptors.request.use(req => {
  // https://github.com/axios/axios/issues/5415
  req.headers.set('foo', 'bar');
  req.headers['Content-Type'] = 123;
  return req;
});

const voidRequestInterceptorId = axios.interceptors.request.use(
    // @ts-expect-error -- Must return an AxiosRequestConfig (or throw)
    (_response) => {},
    (error: any) => Promise.reject(error)
);
const voidResponseInterceptorId = axios.interceptors.response.use(
    // @ts-expect-error -- Must return an AxiosResponse (or throw)
    (_response) => {},
    (error: any) => Promise.reject(error)
);
axios.interceptors.request.eject(voidRequestInterceptorId);
axios.interceptors.response.eject(voidResponseInterceptorId);

axios.interceptors.response.use((response: AxiosResponse) => response);
axios.interceptors.response.use((response: AxiosResponse) => Promise.resolve(response));

axios.interceptors.request.clear();
axios.interceptors.response.clear();

// Adapters

const adapter: AxiosAdapter = (config) => {
  const response: AxiosResponse = {
    data: { foo: 'bar' },
    status: 200,
    statusText: 'OK',
    headers: { 'X-FOO': 'bar' },
    config
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

// axios.all named export

(() => {
  const promises = [
    Promise.resolve(1),
    Promise.resolve(2)
  ];

  const promise: Promise<number[]> = all(promises);
})();

// axios.spread

const fn1 = (a: number, b: number, c: number) => `${a}-${b}-${c}`;
const fn2: (arr: number[]) => string = axios.spread(fn1);

// axios.spread named export
(() => {
  const fn1 = (a: number, b: number, c: number) => `${a}-${b}-${c}`;
  const fn2: (arr: number[]) => string = spread(fn1);
})();

// Promises

axios.get('/user')
    .then((response: AxiosResponse) => 'foo')
    .then((value: string) => {});

axios.get('/user')
    .then((response: AxiosResponse) => Promise.resolve('foo'))
    .then((value: string) => {});

axios.get('/user')
    .then((response: AxiosResponse) => 'foo', (error: any) => 'bar')
    .then((value: string) => {});

axios.get('/user')
    .then((response: AxiosResponse) => 'foo', (error: any) => 123)
    .then((value: string | number) => {});

axios.get('/user')
    .catch((error: any) => 'foo')
    .then((value: any) => {});

axios.get('/user')
    .catch((error: any) => Promise.resolve('foo'))
    .then((value: any) => {});

// Cancellation

const source: CancelTokenSource = axios.CancelToken.source();

axios.get('/user', {
  cancelToken: source.token
}).catch((thrown: AxiosError | Cancel) => {
  if (axios.isCancel(thrown)) {
    const cancel: Cancel = thrown;
    console.log(cancel.message);
  }

  // named export
  if (isCancel(thrown)) {
    const cancel: Cancel = thrown;
    console.log(cancel.message);
  }
});

source.cancel('Operation has been canceled.');

// AxiosError

axios.get('/user')
    .catch((error: AxiosError) => {
      if (axios.isAxiosError(error)) {
        const axiosError: AxiosError = error;
      }

      // named export

      if (isAxiosError(error)) {
        const axiosError: AxiosError = error;
      }
    });

// FormData

axios.toFormData({x: 1}, new FormData());

// named export
toFormData({x: 1}, new FormData());

// formToJSON

axios.toFormData(new FormData());

// named export
formToJSON(new FormData());

// AbortSignal

axios.get('/user', {signal: new AbortController().signal});

// AxiosHeaders methods

axios.get('/user', {
  transformRequest: [
    (data: any, headers) => {
      headers.setContentType('text/plain');
      return 'baz';
    },
    (data: any, headers) => {
      headers['foo'] = 'bar';
      return 'baz'
    }
  ],

  transformResponse: [(data: any, headers: AxiosResponseHeaders) => {
    headers.has('foo');
  }]
});

// config headers

axios.get('/user', {
  headers: new AxiosHeaders({x:1})
});

axios.get('/user', {
  headers: {
    foo : 1
  }
});

// issue #5034

function getRequestConfig1(options: AxiosRequestConfig): AxiosRequestConfig {
  return {
    ...options,
    headers: {
      ...(options.headers as RawAxiosRequestHeaders),
      Authorization: `Bearer ...`,
    },
  };
}

function getRequestConfig2(options: AxiosRequestConfig): AxiosRequestConfig {
  return {
    ...options,
    headers: {
      ...(options.headers as AxiosHeaders).toJSON(),
      Authorization: `Bearer ...`,
    },
  };
}

// Max Rate

axios.get('/user', {
  maxRate: 1000
});

axios.get('/user', {
  maxRate: [1000, 1000],
});

// Node progress

axios.get('/user', {
  onUploadProgress: (e: AxiosProgressEvent) => {
    console.log(e.loaded);
    console.log(e.total);
    console.log(e.progress);
    console.log(e.rate);
  }
});

// adapters

axios.get('/user', {
  adapter: 'xhr'
});

axios.get('/user', {
  adapter: 'http'
});

axios.get('/user', {
  adapter: ['xhr', 'http']
});

// AxiosHeaders

// iterator

const headers = new AxiosHeaders({foo: "bar"})

for (const [header, value] of headers) {
  console.log(header, value);
}

// index signature

(()=>{
  const headers = new AxiosHeaders({x:1});

  headers.y = 2;
})();

// AxiosRequestHeaders

(()=>{
  const headers:AxiosRequestHeaders = new AxiosHeaders({x:1});

  headers.y = 2;

  headers.get('x');
})();

// AxiosHeaders instance assigment

{
  const requestInterceptorId: number = axios.interceptors.request.use(
      async (config) => {
        config.headers.Accept ="foo";
        config.headers.setAccept("foo");
        config.headers = new AxiosHeaders({x:1});
        config.headers.foo = "1";
        config.headers.set('bar', '2');
        config.headers.set({myHeader: "myValue"})
        config.headers = new AxiosHeaders({myHeader: "myValue"});
        config.headers = {...config.headers} as AxiosRequestHeaders;
        return config;
      },
      (error: any) => Promise.reject(error)
  );
}

{
  const config: AxiosRequestConfig = {headers: new AxiosHeaders({foo: 1})};

  axios.get('', {
    headers: {
      bar: 2,
      ...config.headers
    }
  });
}
