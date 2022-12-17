
const setupFetchTest = (
    platformName,
    axios,
    axiosModule,
    withMockFetch,
    fetchConfigurator,
    getFetch,
) => (
    describe,
    testCase,
    assertEquals,
    assertExists,
    testFactory = null,
    beforeEach = null,
    afterEach = null,
) => {
    testFactory = testFactory || function (ctx, op) {
        return function wrappedTestFactory() {
            op.bind(ctx);
            return op();
        };
    };

    if (typeof beforeEach === 'function') {
        // noinspection JSValidateTypes
        beforeEach();
    }

    describe("axios: fetch facade tests", testFactory(this, async function (t) {
        await testCase(this, t, "should be able to create an axios instance", async function () {
            assertExists(this, axios, "axios should be importable in Deno");
            const instance = new axiosModule.Axios({});
            assertExists(this, instance, "should be able to create an Axios instance");
            assertExists(this, axios, "main default Axios instance should exist");
            const subInstance = axiosModule.create();
            assertExists(this, subInstance, "should be able to spawn sub-instance of Axios from default instance");
        });

        await testCase(this, t, "fake adapter should fail", withMockFetch(async function () {
            try {
                await axios('https://stubbed_domain.local:1/foo', {
                    adapter: 'i-do-not-exist'
                });
            } catch (err) {
                assertExists(this, err, "should have thrown an error");
            }
        }));

        await testCase(this, t, "should support specifying the `fetch` adapter by name", withMockFetch(async function () {
            await axios('https://stubbed_domain.local:1/foo', fetchConfigurator({
                adapter: 'fetch'
            }));
        }));

        await testCase(this, t, "should support specifying the `fetch` adapter by reference", withMockFetch(async function () {
            await axios('https://stubbed_domain.local:1/foo', fetchConfigurator({
                adapter: axiosModule.FetchAdapter
            }));
        }));
    }));

    describe("axios fetch tests", testFactory(this, async function(t) {
        // inputs: string
        await testCase(this, t, "should properly parse a string URL input", withMockFetch(async function () {
            await axios('https://stubbed_domain.local:1/foo');
            const fetch = await getFetch();
            assertExists(this, fetch, "should have fetch request intercepted via mock");
            assertEquals(this, fetch.input.url, 'https://stubbed_domain.local:1/foo');
        }));

        // inputs: `URL`
        await testCase(this, t, "should properly parse a string URL input", withMockFetch(async function () {
            await axios(new URL('https://stubbed_domain.local:1/foo'));
            const fetch = await getFetch();
            assertExists(this, fetch, "should have fetch request intercepted via mock");
            assertEquals(this, fetch.input.url, 'https://stubbed_domain.local:1/foo');
        }));

        await testCase(this, t, "should support specifying a URL object in config", withMockFetch(async function () {
            await axios(fetchConfigurator({
              url: new URL('https://stubbed_domain.local:1/foo'),
            }));

            assertEquals(
                this,
                (await getFetch()).input.url,
                'https://stubbed_domain.local:1/foo'
            );
        }));
    }));

    if (typeof afterEach === 'function') {
        // noinspection JSValidateTypes
        afterEach();
    }
}

export default {
    setupFetchTest
};
