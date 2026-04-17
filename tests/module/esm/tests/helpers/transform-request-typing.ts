import axios, { AxiosRequestConfig, AxiosRequestTransformer } from 'axios';

type Payload = {
  foo: string;
  count: number;
};

const transformer: AxiosRequestTransformer<Payload> = function (data, headers) {
  headers.setContentType('application/json');
  data.foo.toUpperCase();
  data.count.toFixed();
  const requestMethod: string | undefined = this.method;
  console.log(requestMethod);

  // @ts-expect-error property does not exist on Payload
  data.bar;

  return JSON.stringify(data);
};

const config: AxiosRequestConfig<Payload> = {
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
  ],
};

axios.request(config);
