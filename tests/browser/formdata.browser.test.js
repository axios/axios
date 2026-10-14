import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import axios from '../../index.js';

class MockXMLHttpRequest {
  constructor() {
    this.requestHeaders = {};
    this.responseHeaders = '';
    this.readyState = 0;
    this.status = 0;
    this.statusText = '';
    this.responseText = '';
    this.response = null;
    this.onreadystatechange = null;
    this.onloadend = null;
    this.upload = {
      addEventListener() {},
    };
  }

  open(method, url, async = true) {
    this.method = method;
    this.url = url;
    this.async = async;
  }

  setRequestHeader(key, value) {
    this.requestHeaders[key] = value;
  }

  addEventListener() {}

  getAllResponseHeaders() {
    return this.responseHeaders;
  }

  send(data) {
    this.params = data;
    requests.push(this);
  }

  respondWith({ status = 200, statusText = 'OK', responseText = '', responseHeaders = '' } = {}) {
    this.status = status;
    this.statusText = statusText;
    this.responseText = responseText;
    this.response = responseText;
    this.responseHeaders = responseHeaders;
    this.readyState = 4;

    queueMicrotask(() => {
      if (this.onloadend) {
        this.onloadend();
      } else if (this.onreadystatechange) {
        this.onreadystatechange();
      }
    });
  }

  abort() {}
}

let requests = [];
let OriginalXMLHttpRequest;

const getLastRequest = () => {
  const request = requests.at(-1);

  expect(request).toBeDefined();

  return request;
};

describe('formdata (vitest browser)', () => {
  beforeEach(() => {
    requests = [];
    OriginalXMLHttpRequest = window.XMLHttpRequest;
    window.XMLHttpRequest = MockXMLHttpRequest;
  });

  afterEach(() => {
    window.XMLHttpRequest = OriginalXMLHttpRequest;
  });

  it('should preserve repeated values and files when converting a form to JSON', () => {
    const form = document.createElement('form');
    ['first', 'second', 'third'].forEach((value) => {
      const input = document.createElement('input');
      input.name = 'items[id]';
      input.value = value;
      form.append(input);
    });

    expect(axios.formToJSON(form)).toEqual({ items: { id: ['first', 'second', 'third'] } });

    const data = new FormData(form);
    const files = ['first', 'second', 'third'].map((name) => new File([name], name + '.txt'));
    files.forEach((file) => data.append('files', file));
    const result = axios.formToJSON(data);

    expect(result.items).toEqual({ id: ['first', 'second', 'third'] });
    files.forEach((file, index) => expect(result.files[index]).toBe(file));
  });

  it('should preserve indexed fields interleaved with repeated JSON request fields', async () => {
    const data = new FormData();
    data.append('items', 'first');
    data.append('items', 'second');
    data.append('items[01]', 'named');
    data.append('items', 'third');
    data.append('items', 'fourth');

    const responsePromise = axios.post('/foo', data, {
      headers: { 'Content-Type': 'application/json' },
    });
    const request = getLastRequest();

    expect(JSON.parse(request.params)).toEqual({
      items: [{ 0: 'first', 1: 'second', '01': 'named' }, 'third', 'fourth'],
    });

    request.respondWith({ responseText: '{}' });
    await responsePromise;
  });

  it('should allow FormData posting', async () => {
    const responsePromise = axios.postForm('/foo', {
      a: 'foo',
      b: 'bar',
    });
    const request = getLastRequest();

    expect(request.params).toBeInstanceOf(FormData);
    expect(Object.fromEntries(request.params.entries())).toEqual({
      a: 'foo',
      b: 'bar',
    });

    request.respondWith({
      status: 200,
      responseText: '{}',
      responseHeaders: 'Content-Type: application/json',
    });
    await responsePromise;
  });
});
