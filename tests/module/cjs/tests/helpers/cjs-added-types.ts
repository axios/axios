import axios = require('axios');

const headers = new axios.AxiosHeaders();
const iterableHeaders: Iterable<[string, axios.AxiosHeaderValue]> = [['x-test', 'ok']];
headers.set(iterableHeaders);
const serializedHeaders: string = headers.toString();
const parsedParameters: axios.AxiosHeaderParameters = axios.AxiosHeaders.parseParameters(
  'multipart/form-data; boundary="test"'
);
headers.set('content-type', 'multipart/form-data; boundary="test"');
const parsedHeaderParameters: axios.AxiosHeaderParameters = headers.get(
  'content-type',
  axios.AxiosHeaders.parseParameters
);

const source = axios.CancelToken.source();
source.token.subscribe((cancel) => {
  const message: string | undefined = cancel && cancel.message;
  console.log(message);
});
source.token.unsubscribe(() => {});
const signal: AbortSignal = source.token.toAbortSignal();

const cancel = new axios.CanceledError<{ ok: true }>(
  'stop',
  {} as axios.InternalAxiosRequestConfig,
  {}
);
const cancelFlag: boolean | undefined = cancel.__CANCEL__;
const cancelCtor: typeof axios.CanceledError = axios.Cancel;
const cancelFromAlias = new cancelCtor('from alias');

const status = axios.HttpStatusCode.WebServerIsDown;

class CustomBlob {
  constructor(_parts?: any[]) {}
}

const serializerOptions: axios.FormSerializerOptions = {
  maxDepth: 2,
  Blob: CustomBlob,
};

axios.toFormData({ file: new Uint8Array([1]) }, undefined, serializerOptions);

interface SearchBody {
  includeArchived: boolean;
}

interface SearchParams {
  query: string;
  page?: number;
}

const paramsConfig: axios.AxiosRequestConfig<SearchBody, SearchParams> = {
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

const customParamsSerializer: axios.CustomParamsSerializer<SearchParams> = (params) => params.query;
const rawParamsConfig: axios.RawAxiosRequestConfig<SearchBody, SearchParams> = paramsConfig;
const internalParamsConfig = {
  ...paramsConfig,
  headers: new axios.AxiosHeaders(),
} as axios.InternalAxiosRequestConfig<SearchBody, SearchParams>;
const paramsResponse = {} as axios.AxiosResponse<unknown, SearchBody, {}, SearchParams>;
const paramsError = {} as axios.AxiosError<unknown, SearchBody, SearchParams>;

const internalQuery: string = internalParamsConfig.params!.query;
const responseQuery: string = paramsResponse.config.params!.query;
const errorQuery: string = paramsError.config!.params!.query;

axios.get('/search', paramsConfig).then((response) => {
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

const legacyParamsConfig: axios.AxiosRequestConfig = {
  params: 'legacy values remain accepted',
  paramsSerializer: (params) => {
    const legacyParams: Record<string, any> = params;
    // @ts-expect-error -- the default serializer input remains a params record, not any
    const legacyParamsNumber: number = params;
    void legacyParamsNumber;
    return String(legacyParams.query);
  },
};

axios.get<unknown, axios.AxiosResponse<unknown>, any, SearchParams>('/search', {
  params: { query: 'axios' },
});

const invalidParamsConfig: axios.AxiosRequestConfig<unknown, SearchParams> = {
  // @ts-expect-error -- params must match the explicit request params type
  params: { query: 1 },
};

axios.get<unknown, axios.AxiosResponse<unknown>, any, SearchParams>('/search', {
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
