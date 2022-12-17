
import axios from "https://axios.elide.dev/axios/1.2.1-fetch/beta1/generic/axios.mjs";
import {assertEquals, assertExists} from "https://deno.land/std@0.168.0/testing/asserts.ts";

Deno.test("deno: axios fetch example", async (t) => {
    await t.step("should be able to import axios as a generic ESM module", async () => {
        assertExists(axios, "axios should be importable in Deno");
    });

    await t.step("should be able to fetch some JSON from Deno", async () => {
        const response = await axios.get("https://httpbin.org/json");
        assertEquals(response.status, 200);
        assertEquals(response.data.slideshow.title, "Sample Slide Show");
    })
});
