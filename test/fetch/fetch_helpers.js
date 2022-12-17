
let fetchStubbed = false;
let fetchQueue = [];
let cachedGlobalFetch = null;

const defaultMockResponseHeaders = {
    'Content-Type': 'test/mock',
};

const defaultMockResponseInfo = {
    status: 200,
    statusText: 'OK',
    headers: new Headers(defaultMockResponseHeaders),
    body: null,
};

const defaultFetchOptions = {
    mock: defaultMockResponseInfo
};

function createResponse(config, statusCode, statusMessage, headers, body) {
    return new Response(body || null, Object.assign({}, defaultMockResponseInfo,{
        status: statusCode || 200,
        statusText: statusMessage || 'OK',
        headers: headers || new Headers(defaultMockResponseHeaders),
    }));
}

function mockFetch(fetchTarget) {
    function mockFetch(input, opts) {
        const options = opts || defaultFetchOptions;
        if (!options.mock) {
            return fetchTarget(input, options);
        }
        fetchQueue.push({
            input,
            options: options || {},
        })
        return new Promise(function (resolve, reject) {
            if (options.mock && options.mock.error) {
                reject(options.mock.error);
            } else {
                resolve(createResponse(
                    options,
                    options.mock ? options.mock.statusCode : 200,
                    options.mock ? options.mock.statusMessage : 'OK',
                    options.mock ? options.mock.headers : defaultMockResponseHeaders,
                    options.mock ? options.mock.body : null,
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
    fetchStubbed = true;
    fetchQueue = [];
    cachedGlobalFetch = target.fetch || fetchPolyfill;
    target.fetch = mockFetch(fetchPolyfill);
};

export function teardownMockFetch(fetchPolyfill, target) {
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
