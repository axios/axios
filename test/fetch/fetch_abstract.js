
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
 * @return {!ConfiguredSuiteExecutor} Configured function which executes the test suite
 */
const setupFetchTest = (
    platformName,
    axios,
    axiosModule,
    withMockFetch,
    fetchConfigurator,
    getFetch,
) => (
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

    describe("axios: fetch facade tests", this, async function (t) {
        await it(this, t, "should be able to create an axios instance", async function () {
            assertExists(this, axios, "axios should be importable in Deno");
            const instance = new axiosModule.Axios({});
            assertExists(this, instance, "should be able to create an Axios instance");
            assertExists(this, axios, "main default Axios instance should exist");
            const subInstance = axiosModule.create();
            assertExists(this, subInstance, "should be able to spawn sub-instance of Axios from default instance");
        });

        await it(this, t, "fake adapter should fail", withMockFetch(async function () {
            try {
                await axios('https://stubbed_domain.local:1/foo', {
                    adapter: 'i-do-not-exist'
                });
            } catch (err) {
                assertExists(this, err, "should have thrown an error");
            }
        }));

        await it(this, t, "should support specifying the `fetch` adapter by name", withMockFetch(async function () {
            await axios('https://stubbed_domain.local:1/foo', fetchConfigurator({
                adapter: 'fetch'
            }));
        }));

        await it(this, t, "should support specifying the `fetch` adapter by reference", withMockFetch(async function () {
            await axios('https://stubbed_domain.local:1/foo', fetchConfigurator({
                adapter: axiosModule.FetchAdapter
            }));
        }));
    });

    describe("axios fetch tests", this, async function(t) {
        // inputs: string
        await it(this, t, "should properly parse a string URL input", withMockFetch(async function () {
            await axios('https://stubbed_domain.local:1/foo');
            const fetch = await getFetch();
            assertExists(this, fetch, "should have fetch request intercepted via mock");
            assertEquals(this, fetch.input.url, 'https://stubbed_domain.local:1/foo');
        }));

        // inputs: `URL`
        await it(this, t, "should properly parse a string URL input", withMockFetch(async function () {
            await axios(new URL('https://stubbed_domain.local:1/foo'));
            const fetch = await getFetch();
            assertExists(this, fetch, "should have fetch request intercepted via mock");
            assertEquals(this, fetch.input.url, 'https://stubbed_domain.local:1/foo');
        }));

        await it(this, t, "should support specifying a URL object in config", withMockFetch(async function () {
            await axios(fetchConfigurator({
              url: new URL('https://stubbed_domain.local:1/foo'),
            }));

            assertEquals(
                this,
                (await getFetch()).input.url,
                'https://stubbed_domain.local:1/foo'
            );
        }));

        await it(this, t, "should support fetching JSON", withMockFetch(async function () {
            const response = await axios(fetchConfigurator({
                url: new URL('https://httpbin.org/json'),
                responseType: 'json'
            }));

            assertExists(response, "should not get `null` response from axios fetch");

            assertEquals(
                this,
                response.status,
                200,
            )
            assertEquals(
                this,
                response.data.slideshow.title,
                "Sample Slide Show",
            );
        }));

        await it(this, t, "should support fetching text", withMockFetch(async function () {
            const response = await axios(fetchConfigurator({
                url: new URL('https://httpbin.org/html'),
                responseType: 'text'
            }));

            assertExists(response, "should not get `null` response from axios fetch");

            assertEquals(
                this,
                response.status,
                200,
            )
            assert(
                this,
                response.data.includes("Herman Melville"),
            );
        }));
    });

    if (typeof afterAll === 'function') {
        // noinspection JSValidateTypes
        afterAll();
    }
}

export default {
    setupFetchTest
};
