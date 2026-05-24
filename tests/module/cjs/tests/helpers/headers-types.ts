import axios = require('axios');

const headers = new axios.AxiosHeaders({ x: 1 });

headers.y = 2;
headers.someCustomHeader = 'foo';
headers.anotherCustomHeader = ['foo', 'bar'];

// @ts-expect-error -- Header values must be assignable to AxiosHeaderValue.
headers.invalidHeader = Promise.resolve('foo');
