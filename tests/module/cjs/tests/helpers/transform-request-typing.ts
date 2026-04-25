import axios = require('axios');

type Payload = {
  foo: string;
  count: number;
};

type OtherPayload = {
  other: number;
};

const transformer: axios.AxiosRequestTransformer<Payload> = function (data, headers) {
  headers.setContentType('application/json');
  data.foo.toUpperCase();
  data.count.toFixed();

  // `this` is narrowed to InternalAxiosRequestConfig<Payload>, so this.data is Payload
  this.data?.foo.toUpperCase();
  this.data?.count.toFixed();
  // @ts-expect-error this.data is Payload, not OtherPayload
  this.data?.other;

  // @ts-expect-error property does not exist on Payload
  data.bar;

  return JSON.stringify(data);
};

const wrongTransformer: axios.AxiosRequestTransformer<OtherPayload> = (data) => JSON.stringify(data);

const config: axios.AxiosRequestConfig<Payload> = {
  data: {
    foo: 'hello',
    count: 1,
  },
  transformRequest: [
    transformer,
    (data) => {
      data.foo.toUpperCase();
      data.count.toFixed();

      // @ts-expect-error property does not exist on Payload
      data.bar;

      return JSON.stringify(data);
    },
    // @ts-expect-error transformer payload type does not match config D
    wrongTransformer,
  ],
};

void axios.request(config);
