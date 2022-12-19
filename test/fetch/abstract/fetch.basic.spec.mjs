
// noinspection JSUnusedGlobalSymbols

/** @type {!AxiosTestModule} */
export const runTest = async function ({
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
}) {
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
}
