import axios = require('axios');

// Importing Axios and choosing HTTP must work without the DOM library.
axios.create({ adapter: 'http' });

// Existing wrappers may explicitly use the original constructor body type.
type LegacyBody = ArrayBuffer | ArrayBufferView | Blob | FormData | URLSearchParams | string | null;

const normalizeBody = (body: LegacyBody | ReadableStream<Uint8Array> | undefined) =>
  ArrayBuffer.isView(body)
    ? new Uint8Array(body.buffer, body.byteOffset, body.byteLength).slice()
    : body;

class LegacyResponse extends Response {
  constructor(body?: LegacyBody, init?: ResponseInit) {
    super(normalizeBody(body), init);
  }
}

// Supporting Axios's tracked stream must not require Node-only iterable inputs.
class StreamCompatibleResponse extends Response {
  constructor(body?: LegacyBody | ReadableStream<Uint8Array>, init?: ResponseInit) {
    super(normalizeBody(body), init);
  }
}

axios.create({ adapter: 'fetch', env: { Response: LegacyResponse } });
axios.create({ env: { Response: StreamCompatibleResponse } });

// Fetch environment constructors can be disabled explicitly.
axios.create({
  adapter: 'fetch',
  env: {
    Request: null,
    Response: null,
  },
});

type ResponseConstructor = NonNullable<NonNullable<axios.AxiosRequestConfig['env']>['Response']>;
const ResponseOverride: ResponseConstructor = LegacyResponse;

new ResponseOverride();
new ResponseOverride(null);
new ResponseOverride('body');
new ResponseOverride(new ArrayBuffer(8));
new ResponseOverride(new Uint8Array(8));
new ResponseOverride(new DataView(new ArrayBuffer(8)));
new ResponseOverride(new Blob(['body']));
new ResponseOverride(new FormData());
new ResponseOverride(new URLSearchParams());

// Calls through the configured constructor retain the original body contract,
// including views typed through the general ArrayBufferView interface.
function constructResponse(Response: ResponseConstructor, body: ArrayBufferView) {
  return new Response(body);
}
constructResponse(ResponseOverride, new Uint8Array(8));

// Invalid body values must not silently become any.
// @ts-expect-error Response bodies cannot be numbers.
new ResponseOverride(123);

class StringOnlyResponse extends Response {
  constructor(body?: string | null, init?: ResponseInit) {
    super(body, init);
  }
}

axios.create({
  env: {
    // @ts-expect-error String-only constructors cannot accept the existing body inputs.
    Response: StringOnlyResponse,
  },
});
