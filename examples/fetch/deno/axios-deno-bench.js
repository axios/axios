
import axios from "https://axios.elide.dev/axios/1.2.1-fetch/beta1/generic/axios.mjs";
import _testHelpers from "../../../test/fetch/fetch_helpers.js";
import {assertEquals, assertExists} from "https://deno.land/std@0.168.0/testing/asserts.ts";

const configuredAxios = (input, cfg) => axios(input, cfg || _testHelpers.fetchConfigurator(
    globalThis,
    input,
));

const sampleTarget = "https://i-do-not-exist.local:1/foo";
const sampleUrl = new URL(sampleTarget);

Deno.bench("fetch adapter overhead", async () => {
    return await _testHelpers.withMockFetch(globalThis.fetch, globalThis, this, async () => {
        const responsePromise = configuredAxios({
            url: sampleTarget,
            parsedUrl: sampleUrl
        });
        assertExists(responsePromise);
        const response = await responsePromise;
        assertExists(response);
        assertEquals(response.status, 200);
    });
});
