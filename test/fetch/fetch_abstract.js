
/**
 * Instantiate the abstract Fetch testsuite, specialized with the provided functions and capabilities; a function is
 * returned which, when executed, runs the configured test-suite.
 *
 * @param {!string} platformName Name of the platform under test
 * @param {!AxiosTestInstance} axios Main Axios instance to use for testing
 * @param {!AxiosModule} axiosModule Axios module to use for testing
 * @param {!MockFetchFn} withMockFetch Function which installs and cleans up the Fetch mock
 * @param {!FetchConfiguratorFn} fetchConfigurator Fetch test configuration injector function
 * @param {!FetchGetter} getFetch Retrieves the last-seen mock Fetch call during a given test
 * @param {!string[]} testImports List of test files to import and run
 * @return {!ConfiguredSuiteExecutor} Configured function which executes the test suite
 */
const setupFetchTest = (
    platformName,
    axios,
    axiosModule,
    withMockFetch,
    fetchConfigurator,
    getFetch,
    testImports = [
        './abstract/fetch.basic.spec.mjs'
    ],
) => async (
    suiteDescriber,
    caseDescriber,
    assert,
    assertEquals,
    assertExists,
    testFactory,
    beforeAll,
    afterAll,
    beforeEach,
    afterEach,
) => {
    // prepare or shim the test factory
    testFactory = testFactory || function (ctx, op) {
        return function wrappedTestFactory() {
            op.bind(ctx);
            return op();
        };
    };

    // prepare or shim for the beforeEach/afterEach hooks
    beforeEach = beforeEach || (() => {});
    afterEach = afterEach || (() => {});

    // wrap description and case functions to call hooks
    const describe = function (description, ctx, op) {
        return suiteDescriber(description, testFactory(ctx, op));
    };

    const it = function (ctx, param, label, op) {
        try {
            beforeEach();
            return caseDescriber(ctx, param, label, op);
        } finally {
            afterEach();
        }
    }

    if (typeof beforeAll === 'function') {
        // noinspection JSValidateTypes
        beforeAll();
    }

    await Promise.all(testImports.map(async (target) => {
        (await import(target)).runTest({
            platformName,
            axios,
            axiosModule,
            withMockFetch,
            fetchConfigurator,
            getFetch,
            describe,
            it,
            assert,
            assertEquals,
            assertExists,
        });
    }))

    if (typeof afterAll === 'function') {
        // noinspection JSValidateTypes
        afterAll();
    }
}

export default {
    setupFetchTest
};
