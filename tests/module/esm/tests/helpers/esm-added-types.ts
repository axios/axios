import axios, {
  AxiosHeaders,
  CanceledError,
  HttpStatusCode,
  isCancel,
  toFormData,
  type AxiosHeaderParameters,
  type AxiosHeaderValue,
  type AxiosError,
  type AxiosPromise,
  type AxiosRequestConfig,
  type AxiosResponse,
  type CustomParamsSerializer,
  type FormSerializerOptions,
  type InternalAxiosRequestConfig,
  type RawAxiosRequestConfig,
} from 'axios';

const utf8AuthConfig: AxiosRequestConfig = {
  auth: { username: 'π', password: 'x' },
  transitional: { encodeBasicAuthUsername: true },
};
const legacyAuthConfig: AxiosRequestConfig = {
  transitional: { encodeBasicAuthUsername: false },
};
const invalidAuthConfig: AxiosRequestConfig = {
  transitional: {
    // @ts-expect-error -- the encoding opt-in only accepts booleans
    encodeBasicAuthUsername: 'true',
  },
};

const headers = new AxiosHeaders();
const iterableHeaders: Iterable<[string, AxiosHeaderValue]> = [['x-test', 'ok']];
headers.set(iterableHeaders);
const serializedHeaders: string = headers.toString();
const parsedParameters: AxiosHeaderParameters = AxiosHeaders.parseParameters(
  'multipart/form-data; boundary="test"'
);
headers.set('content-type', 'multipart/form-data; boundary="test"');
const parsedHeaderParameters: AxiosHeaderParameters = headers.get(
  'content-type',
  AxiosHeaders.parseParameters
);
headers.set('x-test', 'next', (value, name, instance) => instance.has(name));

const source = axios.CancelToken.source();
source.token.subscribe((cancel) => {
  const message: string | undefined = cancel && cancel.message;
  console.log(message);
});
source.token.unsubscribe(() => {});
const signal: AbortSignal = source.token.toAbortSignal();

const cancel = new CanceledError<{ ok: true }>(
  'stop',
  {} as InternalAxiosRequestConfig,
  {}
);
const cancelFlag: boolean | undefined = cancel.__CANCEL__;
const cancelCtor: typeof CanceledError = axios.Cancel;
const cancelFromAlias = new cancelCtor('from alias');

const status: HttpStatusCode = HttpStatusCode.WebServerIsDown;
const unknownErrorStatus: HttpStatusCode = HttpStatusCode.WebServerReturnsAnUnknownError;
const contentTooLargeStatus: HttpStatusCode = HttpStatusCode.ContentTooLarge;
const unprocessableContentStatus: HttpStatusCode = HttpStatusCode.UnprocessableContent;

class CustomBlob {
  constructor(_parts?: any[]) {}
}

const serializerOptions: FormSerializerOptions = {
  maxDepth: 2,
  Blob: CustomBlob,
};

toFormData({ file: new Uint8Array([1]) }, undefined, serializerOptions);

interface SearchBody {
  includeArchived: boolean;
}

interface SearchParams {
  query: string;
  page?: number;
}

const paramsConfig: AxiosRequestConfig<SearchBody, SearchParams> = {
  data: { includeArchived: false },
  params: { query: 'axios', page: 1 },
  paramsSerializer: (params) => {
    const query: string = params.query;
    const page: number | undefined = params.page;
    // @ts-expect-error -- serializer params use the request params type
    const invalidQuery: number = params.query;
    void invalidQuery;
    return `${query}:${page ?? 1}`;
  },
  withXSRFToken: (config) => config.params?.query === 'axios',
};

const customParamsSerializer: CustomParamsSerializer<SearchParams> = (params) => params.query;
const rawParamsConfig: RawAxiosRequestConfig<SearchBody, SearchParams> = paramsConfig;
const internalParamsConfig = {
  ...paramsConfig,
  headers: new AxiosHeaders(),
} as InternalAxiosRequestConfig<SearchBody, SearchParams>;
const paramsResponse = {} as AxiosResponse<unknown, SearchBody, {}, SearchParams>;
const paramsError = {} as AxiosError<unknown, SearchBody, SearchParams>;
declare const paramsPromise: AxiosPromise<unknown, SearchBody, SearchParams>;

const responseDuration: number | undefined = paramsResponse.duration;
const errorResponseDuration: number | undefined = paramsError.response?.duration;
paramsResponse.duration = 25;
paramsResponse.duration = undefined;
// @ts-expect-error -- response duration is numeric when present
paramsResponse.duration = '25';
// Custom adapters can still return a response without timing metadata.
const untimedResponse: AxiosResponse = {
  data: null,
  status: 200,
  statusText: 'OK',
  headers: {},
  config: internalParamsConfig,
};

const internalQuery: string = internalParamsConfig.params!.query;
const responseQuery: string = paramsResponse.config.params!.query;
const errorQuery: string = paramsError.config!.params!.query;

paramsPromise.then((response) => {
  const promiseData: SearchBody | undefined = response.config.data;
  const promiseParams: SearchParams | undefined = response.config.params;
  // @ts-expect-error -- AxiosPromise preserves the request data type
  const invalidPromiseData: { includeArchived: string } | undefined = response.config.data;
  // @ts-expect-error -- AxiosPromise preserves the request params type
  const invalidPromiseParams: { query: number } | undefined = response.config.params;
  void promiseData;
  void promiseParams;
  void invalidPromiseData;
  void invalidPromiseParams;
});

axios.get('/search', paramsConfig).then((response) => {
  const duration: number | undefined = response.duration;
  // @ts-expect-error -- inferred response duration is not a string
  const invalidDuration: string = response.duration;
  void duration;
  void invalidDuration;
  const aliasData: SearchBody | undefined = response.config.data;
  const aliasParams: SearchParams | undefined = response.config.params;
  // @ts-expect-error -- default alias responses preserve the request data type
  const invalidAliasData: { includeArchived: string } | undefined = response.config.data;
  // @ts-expect-error -- default alias responses preserve the request params type
  const invalidAliasParams: { query: number } | undefined = response.config.params;
  void aliasData;
  void aliasParams;
  void invalidAliasData;
  void invalidAliasParams;
});

declare const thrown: unknown;

if (isCancel<unknown, SearchBody, SearchParams>(thrown)) {
  const canceledData: SearchBody | undefined = thrown.config?.data;
  const canceledParams: SearchParams | undefined = thrown.config?.params;
  // @ts-expect-error -- canceled request data must not be widened to any
  const invalidCanceledData: { includeArchived: string } | undefined = thrown.config?.data;
  // @ts-expect-error -- canceled request params must not be widened to any
  const invalidCanceledParams: { query: number } | undefined = thrown.config?.params;
  void canceledData;
  void canceledParams;
  void invalidCanceledData;
  void invalidCanceledParams;
}

const legacyParamsConfig: AxiosRequestConfig = {
  params: 'legacy values remain accepted',
  paramsSerializer: (params) => {
    const legacyParams: Record<string, any> = params;
    // @ts-expect-error -- the default serializer input remains a params record, not any
    const legacyParamsNumber: number = params;
    void legacyParamsNumber;
    return String(legacyParams.query);
  },
};

axios.get<unknown, AxiosResponse<unknown>, any, SearchParams>('/search', {
  params: { query: 'axios' },
});

const invalidParamsConfig: AxiosRequestConfig<unknown, SearchParams> = {
  // @ts-expect-error -- params must match the explicit request params type
  params: { query: 1 },
};

axios.get<unknown, AxiosResponse<unknown>, any, SearchParams>('/search', {
  // @ts-expect-error -- request aliases enforce their trailing params type
  params: { query: 1 },
});

const mergedParamsConfig = axios.mergeConfig<SearchBody, SearchParams>(
  rawParamsConfig,
  paramsConfig
);
const mergedQuery: string = mergedParamsConfig.params!.query;

console.log(
  serializedHeaders,
  parsedParameters,
  parsedHeaderParameters,
  signal.aborted,
  cancelFlag,
  cancelFromAlias.message,
  status,
  customParamsSerializer,
  internalQuery,
  responseQuery,
  errorQuery,
  legacyParamsConfig,
  mergedQuery,
  invalidParamsConfig
);
