
let fetchStubbed = false;
let fetchQueue = [];
let cachedGlobalFetch = null;
const fetchDebugLogging = false;

function createHeaders(fromObject) {
    const h = new Headers();
    Object.keys(fromObject).forEach((key) => {
        h.append(key, fromObject[key]);
    });
    return h;
}

const defaultMockResponseHeaders = {
    'Content-Type': 'test/mock',
};

const defaultMockResponseInfo = {
    status: 200,
    statusText: 'OK',
};

const defaultFetchOptions = {
    mock: defaultMockResponseInfo
};

function createResponse(config, statusCode, statusMessage, headers, bodyGenerator, contentTypeIfKnown) {
    const body = (bodyGenerator ? bodyGenerator() : null);
    if (fetchDebugLogging) {
        console.log("[axios:fetch.mock] mock has body: ", !!body);
    }

    const responseInfo = {
        status: statusCode || 200,
        statusText: statusMessage || 'OK',
        headers: Object.assign({}, defaultMockResponseHeaders, {
            'Content-Type': contentTypeIfKnown || 'test/mock',
            'Content-Length': body ? body.length : undefined,
        }, headers || {}),
    };
    if (contentTypeIfKnown) {
        responseInfo.headers['Content-Type'] = contentTypeIfKnown;
    }
    if (fetchDebugLogging) {
        console.log("[axios:fetch.mock] mock response info: ", JSON.stringify(responseInfo));
    }

    return new Response(body, Object.assign({}, defaultMockResponseInfo, responseInfo));
}

function fakeJsonResponse() {
    return JSON.stringify({
        slideshow: {
            author: "Yours Truly",
            date: "date of publication",
            slides: [
                {
                    title: "Wake up to WonderWidgets!",
                    type: "all"
                },
                {
                    items: [
                        "Why <em>WonderWidgets</em> are great",
                        "Who <em>buys</em> WonderWidgets"
                    ],
                    title: "Overview",
                    type: "all"
                }
            ],
            title: "Sample Slide Show"
        }
    });
}

function fakeTextResponse() {
    return (
      "<!DOCTYPE html>\n" +
      "<html>\n" +
      "  <head>\n" +
      "  </head>\n" +
      "  <body>\n" +
      "      <h1>Herman Melville - Moby-Dick</h1>\n" +
      "\n" +
      "      <div>\n" +
      "        <p>\n" +
      "          Availing himself of the mild, summer-cool weather that now reigned in these latitudes...\n" +
      "        </p>\n" +
      "      </div>\n" +
      "  </body>\n" +
      "</html>" +
      ""
    );
}

function mockFetch(fetchTarget) {
    function mockFetch(input, opts) {
        if (fetchDebugLogging) {
            console.log("[axios:fetch.mock] mock fetch call: ", input, JSON.stringify(opts || {}));
        }
        const options = opts || defaultFetchOptions;
        if (!options.mock) {
            if (fetchDebugLogging) {
                console.log("[axios:fetch.mock] mocking is not active");
            }
            return fetchTarget(input, options);
        }
        fetchQueue.push({
            input,
            options: options || {},
        })
        return new Promise(function (resolve, reject) {
            if (options.mock && options.mock.error) {
                if (fetchDebugLogging) {
                    console.log("[axios:fetch.mock] mock injected error", options.mock.error);
                }

                // if the mock tells us to fake a rejection, do that, with the provided error.
                reject(options.mock.error);
            } else {
                let resolvedUrl;
                if (typeof input === 'string') {
                    resolvedUrl = input;
                } else if (input instanceof URL) {
                    resolvedUrl = input.toString();
                } else if (input instanceof Request) {
                    resolvedUrl = input.url;
                }
                let responseGenerator = null;
                let knownContentType = null;
                if (resolvedUrl === 'https://httpbin.org/json') {
                    // fake a JSON response
                    responseGenerator = fakeJsonResponse;
                    knownContentType = 'application/json';
                } else if (resolvedUrl === 'https://httpbin.org/html') {
                    // fake a text response
                    responseGenerator = fakeTextResponse;
                    knownContentType = 'text/html';
                }
                if (fetchDebugLogging) {
                    console.log("[axios:fetch.mock] resolving mock URL: ", resolvedUrl);
                    console.log("[axios:fetch.mock] resolving with mock content-type: ", knownContentType);
                }

                resolve(createResponse(
                    options,
                    options.mock ? options.mock.statusCode : 200,
                    options.mock ? options.mock.statusMessage : 'OK',
                    options.mock?.response ? (options.mock.response.headers || null) : null,
                    options.mock?.response ? (
                        responseGenerator || (() => options.mock?.response.body)
                    ) : responseGenerator,
                    knownContentType,
                ));
            }
        });
    }
    return mockFetch;
}

export function getFetchAtIndex(index) {
    if (fetchQueue.length < 1) {
        throw new Error('No recent fetch to retrieve');
    }
    if (typeof index === 'number') {
        if (!fetchQueue[index]) {
            throw new Error('No fetch at index ' + index);
        }
        return fetchQueue[index];
    }
    return fetchQueue.shift();
}

export function getFetchAsync() {
    return new Promise(function (resolve, reject) {
        try {
            resolve(getFetchAtIndex(0));
        } catch (err) {
            reject(err);
        }
    });
}

export function getFetch() {
    return getFetchAtIndex(0);
}

export function setupMockFetch(fetchPolyfill, target) {
    if (fetchStubbed) {
        return;
    }
    fetchStubbed = true;
    fetchQueue = [];
    cachedGlobalFetch = target.fetch || fetchPolyfill;
    target.fetch = mockFetch(fetchPolyfill);
};

export function teardownMockFetch(fetchPolyfill, target) {
    if (!fetchStubbed) {
        throw new Error('Cannot teardown fetch mock: not active.');
    }
    fetchStubbed = false;
    fetchQueue = [];
    target.fetch = cachedGlobalFetch;
    cachedGlobalFetch = fetchPolyfill;
}

export function withMockFetch(fetchPolyfill, target, ctx, cb, skipResolve) {
    return function (done) {
        try {
            setupMockFetch(fetchPolyfill, target);
            const promise = cb.bind(ctx)(fetchConfigurator, done);
            if (!skipResolve && promise) {
                promise.then(done, (err) => {
                    throw err;
                });
            } else if (skipResolve) {
                return promise;
            }
        } finally {
            if (!skipResolve) {
                teardownMockFetch(fetchPolyfill, target);
            }
        }
    };
}

export function fetchConfigurator(target, config_or_mock, config, forceFetch) {
    return Object.assign({
        adapter: 'fetch'
    }, defaultFetchOptions, config || config_or_mock, (fetchStubbed || forceFetch) ? {
        fetcher: mockFetch(target),
        fetchOptions: {
            mock: config ? config_or_mock : defaultMockResponseInfo,
        }
    } : {});
}

export default {
    getFetchAtIndex,
    getFetchAsync,
    getFetch,
    setupMockFetch,
    teardownMockFetch,
    withMockFetch,
    fetchConfigurator
};
