const axios = require('axios');
const { it, describe } = require('mocha');
const { expect } = require('chai');

const NODE_VERSION = parseInt(process.versions.node.split('.')[0]);
const describeWithFetch = NODE_VERSION < 18 ? describe.skip : describe;

const createFetchMock = (responseFactory) => {
  const calls = [];

  const mockFetch = async (input, init) => {
    calls.push({ input, init: init || {} });

    if (responseFactory) {
      return responseFactory(input, init || {});
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  return {
    mockFetch,
    getCalls: () => calls,
  };
};

describeWithFetch('fetch compat (dist export only)', () => {
  it('uses fetch adapter and resolves JSON response', async () => {
    const { mockFetch, getCalls } = createFetchMock();

    const response = await axios.get('https://example.com/users', {
      adapter: 'fetch',
      env: {
        fetch: mockFetch,
        Request,
        Response,
      },
    });

    expect(response.data).to.deep.equal({ ok: true });
    expect(response.status).to.equal(200);
    expect(getCalls()).to.have.lengthOf(1);
  });

  it('sends method, headers and body for post requests', async () => {
    const { mockFetch, getCalls } = createFetchMock(async (input, init) => {
      const requestInit = init || {};
      const isRequest = input && typeof input !== 'string';
      const method = isRequest ? input.method : requestInit.method;

      const body =
        isRequest && typeof input.clone === 'function'
          ? await input.clone().text()
          : requestInit.body;

      let contentType;
      if (isRequest && input.headers) {
        contentType = input.headers.get('content-type');
      } else if (requestInit.headers) {
        contentType = requestInit.headers['Content-Type'] || requestInit.headers['content-type'];
      }

      return new Response(
        JSON.stringify({
          url: typeof input === 'string' ? input : input.url,
          method,
          contentType,
          body,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    });

    const response = await axios.post(
      'https://example.com/items',
      { name: 'widget' },
      {
        adapter: 'fetch',
        env: {
          fetch: mockFetch,
          Request,
          Response,
        },
      }
    );

    expect(getCalls()).to.have.lengthOf(1);
    expect(response.data.url).to.equal('https://example.com/items');
    expect(response.data.method).to.equal('POST');
    expect(response.data.contentType).to.include('application/json');
    expect(response.data.body).to.equal(JSON.stringify({ name: 'widget' }));
  });

  it('rejects non-2xx fetch responses by default', async () => {
    const { mockFetch } = createFetchMock(
      () =>
        new Response(JSON.stringify({ error: 'boom' }), {
          status: 500,
          statusText: 'Internal Server Error',
          headers: { 'Content-Type': 'application/json' },
        })
    );

    const err = await axios
      .get('https://example.com/fail', {
        adapter: 'fetch',
        env: {
          fetch: mockFetch,
          Request,
          Response,
        },
      })
      .catch((e) => e);

    expect(axios.isAxiosError(err)).to.be.true;
    expect(err.response.status).to.equal(500);
  });

  it('supports cancellation with AbortController in fetch mode', async () => {
    const { mockFetch } = createFetchMock();
    const controller = new AbortController();
    controller.abort();

    const err = await axios
      .get('https://example.com/cancel', {
        adapter: 'fetch',
        signal: controller.signal,
        env: {
          fetch: mockFetch,
          Request,
          Response,
        },
      })
      .catch((e) => e);

    expect(axios.isCancel(err)).to.be.true;
    expect(err.code).to.equal('ERR_CANCELED');
  });
});
