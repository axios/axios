class AxiosResponse {
  #resp;

  constructor(resp) {
    this.#resp = resp;
  }

  get data() {
    return this.#resp.data;
  }

  get config() {
    return this.#resp.config;
  }

  get request() {
    return this.#resp.request;
  }

  get headers() {
    return new Headers(Object.entries(this.#resp.headers));
  }

  get ok() {
    return this.#resp.status >= 200 && this.#resp.status < 300;
  }

  get redirected() {
    return this.#resp.status >= 300 && this.#resp.status < 400;
  }

  get status() {
    return this.#resp.status;
  }

  get statusText() {
    return this.#resp.statusText;
  }

  get type() {
    return 'basic';
  }

  get url() {
    return this.#resp.config.url ?? this.#resp.request.responseURL;
  }

  get body() {
    return this.#resp.data;
  }

  get bodyUsed() {
    return false;
  }

  clone() {
    return new AxiosResponse({ ...this.#resp });
  }

  async arrayBuffer() {
    return new TextEncoder().encode(this.#resp.data).buffer;
  }

  async blob() {
    return new Blob([this.#resp.data], { type: 'text/plain' });
  }

  async formData() {
    throw new Error('formData is not supported by AxiosResponse');
  }

  async json() {
    try {
      return JSON.parse(this.#resp.data);
    } catch (error) {
      throw new Error('The data cannot be parsed as JSON');
    }
  }

  async text() {
    return this.#resp.data;
  }
}

export default AxiosResponse;