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

console.log(
  serializedHeaders,
  parsedParameters,
  parsedHeaderParameters,
  signal.aborted,
  cancelFlag,
  cancelFromAlias.message,
  status
);
