import axios, {
  AxiosHeaders,
  CanceledError,
  HttpStatusCode,
  toFormData,
  type AxiosHeaderValue,
  type FormSerializerOptions,
  type InternalAxiosRequestConfig,
} from 'axios';

const headers = new AxiosHeaders();
const iterableHeaders: Iterable<[string, AxiosHeaderValue]> = [['x-test', 'ok']];
headers.set(iterableHeaders);
const serializedHeaders: string = headers.toString();

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

class CustomBlob {
  constructor(_parts?: any[]) {}
}

const serializerOptions: FormSerializerOptions = {
  maxDepth: 2,
  Blob: CustomBlob,
};

toFormData({ file: new Uint8Array([1]) }, undefined, serializerOptions);

console.log(serializedHeaders, signal.aborted, cancelFlag, cancelFromAlias.message, status);
