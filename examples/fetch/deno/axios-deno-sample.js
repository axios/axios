import axios from "https://axios.elide.dev/axios/1.2.1-fetch/beta2/generic/axios.mjs";
import {assert, assertEquals, assertExists} from "https://deno.land/std@0.168.0/testing/asserts.ts";

Deno.test("deno: axios fetch example", async (t) => {
    await t.step("should be able to import axios as a generic ESM module", async () => {
        assertExists(axios, "axios should be importable in Deno");
    });

    await t.step("should be able to fetch some JSON from Deno", async () => {
        const response = await axios.get("https://httpbin.org/json", {adapter: 'fetch'});
        assertEquals(response.status, 200);
        assertEquals(response.data.slideshow.title, "Sample Slide Show");
    })

    await t.step("should be able to fetch some text data from Deno", async () => {
        const response = await axios.get("https://httpbin.org/html", {
            adapter: 'fetch',
            responseType: 'text'
        });
        assertEquals(response.status, 200);
        assert(response.data.includes('Herman Melville'), "should be able to fetch text");
    })
});
