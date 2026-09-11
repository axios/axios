import axios = require('axios');

// Importing Axios and choosing HTTP must work without the DOM library.
axios.create({ adapter: 'http' });

// Native and stream-compatible custom constructors remain valid overrides.
axios.create({ adapter: 'fetch', env: { Response } });
class CustomResponse extends Response {}
axios.create({ env: { Response: CustomResponse } });

type ResponseConstructor = NonNullable<NonNullable<axios.AxiosRequestConfig['env']>['Response']>;
const ResponseOverride: ResponseConstructor = Response;

new ResponseOverride();
new ResponseOverride(null);
new ResponseOverride('body');
new ResponseOverride(new ArrayBuffer(8));
new ResponseOverride(new Uint8Array(8));
new ResponseOverride(new DataView(new ArrayBuffer(8)));
new ResponseOverride(new Blob(['body']));
new ResponseOverride(new FormData());
new ResponseOverride(new URLSearchParams());
new ResponseOverride(new ReadableStream<Uint8Array>());

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
    // @ts-expect-error Axios supplies a ReadableStream when tracking response bodies.
    Response: StringOnlyResponse,
  },
});
