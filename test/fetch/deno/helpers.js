
import _fetchHelpers, {
    getFetchAtIndex,
    getFetchAsync,
} from "../fetch_helpers.js";

export {
    getFetchAtIndex,
    getFetchAsync,
}


export async function getFetch() {
    return await _fetchHelpers.getFetchAsync(fetch, globalThis);
}

export function setupMockFetch() {
    _fetchHelpers.setupMockFetch(fetch, globalThis);
}

export function teardownMockFetch() {
    _fetchHelpers.teardownMockFetch(fetch, globalThis);
}

export function fetchConfigurator(config_or_mock, config, forceFetch) {
    return _fetchHelpers.fetchConfigurator(fetch, config_or_mock, config, forceFetch);
}

export function withMockFetch(ctxOrCb, cb) {
    const cbk = cb || ctxOrCb;
    const ctx = cb ? ctxOrCb : this;
    return (t) => {
        return _fetchHelpers.withMockFetch(fetch, globalThis, ctx, cbk, /* skipResolve= */ true)(t)
            .then(teardownMockFetch);
    }
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
