import { AxiosHeaders } from '../../../../index.js';

const headers = new AxiosHeaders({ x: 1 });

headers.y = 2;
headers.someCustomHeader = 'foo';
headers.anotherCustomHeader = ['foo', 'bar'];

// @ts-expect-error -- Header values must be assignable to AxiosHeaderValue.
headers.invalidHeader = Promise.resolve('foo');

// @ts-expect-error -- Custom header fields cannot be functions.
headers.invalidFunction = () => 'foo';
