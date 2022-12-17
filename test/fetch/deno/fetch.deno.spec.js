/*global Deno*/
// noinspection JSValidateTypes

import fetchTest from '../fetch_abstract.js';
import _axios from "../../../dist/generic/axios.mjs";

import helpers, {
    getFetch,
    fetchConfigurator,
    withMockFetch,
} from './helpers.js';

import {
    assertEquals,
    assertExists,
} from "https://deno.land/std@0.168.0/testing/asserts.ts";

/**
 * @type {
 *   Axios|function(string):PromiseLike<*>|function(URL):PromiseLike<*>|function(_axios.AxiosRequestConfig):PromiseLike
 * }
 */
const axios = (input, cfg = null) => _axios(input, cfg || (
    fetchConfigurator({}, {}, true)
));

Deno.test("sanity test: `true` should equal `true`", () => {
    assertEquals(true, true);
});

Deno.test("axios: helper tests", () => {
    assertExists(helpers, "helpers should be importable in Deno");
    assertExists(fetchTest, "fetch test abstracts should be importable in Deno");
})

async function testCase(ctx, test, label, operation) {
    return await test.step(label, operation);
}

function doAssertEquals(ctx, ...args) {
    return assertEquals(...args);
}

function doAssertExists(ctx, ...args) {
    return assertExists(...args);
}

fetchTest.setupFetchTest(
    "deno",
    axios,
    _axios,
    withMockFetch,
    fetchConfigurator,
    getFetch,
)(
    Deno.test,
    testCase,
    doAssertEquals,
    doAssertExists,
    (ctx, op) => {
        op.bind(ctx);
        return op;
    },
)
