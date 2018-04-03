import axios, {
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  AxiosInstance,
  AxiosAdapter,
  Cancel,
  CancelToken,
  CancelTokenSource,
  Canceler
} from '../../';

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
  paramsSerializer: (params: any) => 'id=12345',
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
  onUploadProgress: (progressEvent: any) => {},
  onDownloadProgress: (progressEvent: any) => {},
  maxContentLength: 2000,
  validateStatus: (status: number) => status >= 200 && status < 300,
  maxRedirects: 5,
  proxy: {
    host: '127.0.0.1',
    port: 9000
  },
  cancelToken: new axios.CancelToken((cancel: Canceler) => {})
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
interface User {
  id: number;
  name: string;
}

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
	.then(handleResponse)
	.catch(handleError);

axios.delete<User>('/user')
	.then(handleResponse)
	.catch(handleError);

axios.post<User>('/user', { foo: 'bar' })
	.then(handleUserResponse)
	.catch(handleError);

axios.post<User>('/user', { foo: 'bar' }, { headers: { 'X-FOO': 'bar' } })
	.then(handleUserResponse)
	.catch(handleError);

axios.put<User>('/user', { foo: 'bar' })
	.then(handleUserResponse)
	.catch(handleError);

axios.patch<User>('/user', { foo: 'bar' })
	.then(handleUserResponse)
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

axios.defaults.baseURL = 'https://api.example.com/';
axios.defaults.headers.common['Authorization'] = 'token';
axios.defaults.headers.post['X-FOO'] = 'bar';
axios.defaults.timeout = 2500;

instance1.defaults.baseURL = 'https://api.example.com/';
instance1.defaults.headers.common['Authorization'] = 'token';
instance1.defaults.headers.post['X-FOO'] = 'bar';
instance1.defaults.timeout = 2500;

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

// axios.spread

const fn1 = (a: number, b: number, c: number) => `${a}-${b}-${c}`;
const fn2: (arr: number[]) => string = axios.spread(fn1);

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
  .then((value: string) => {});

axios.get('/user')
  .catch((error: any) => Promise.resolve('foo'))
  .then((value: string) => {});

// Cancellation

const source: CancelTokenSource = axios.CancelToken.source();

axios.get('/user', {
  cancelToken: source.token
}).catch((thrown: AxiosError | Cancel) => {
  if (axios.isCancel(thrown)) {
    const cancel: Cancel = thrown;
    console.log(cancel.message);
  }
});

source.cancel('Operation has been canceled.');
