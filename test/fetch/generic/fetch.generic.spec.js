/*global Deno*/
// noinspection JSValidateTypes

import { expect } from '@esm-bundle/chai';
import fetchTest from '../fetch_abstract.js';
import _axios from "../../../index.js";

import helpers, {
    getFetch,
    fetchConfigurator,
    withMockFetch,
} from '../default_helpers.mjs';

/**
 * @type {
 *   Axios|function(string):PromiseLike<*>|function(URL):PromiseLike<*>|function(_axios.AxiosRequestConfig):PromiseLike
 * }
 */
const axios = (input, cfg = null) => _axios(input, cfg || (
    fetchConfigurator({}, {}, true)
));

describe("sanity test: `true` should equal `true`", () => {
    it("should be true", () => {
        expect(true).to.equal(true);
    });
});

describe("axios: helper tests", () => {
    it("should be able to import helpers", () => {
        expect(helpers).to.exist;
    });
    it("should be able to import abstract fetch test suite", () => {
        expect(fetchTest).to.exist;
    });
});

async function testCase(ctx, test, label, operation) {
    it(label, function (done) {
        operation().then(done, (err) => {
            throw err;
        });
    });
}

function doAssert(ctx, condition, message) {
    // return expect(condition, message).to.be.true;
}

function doAssertEquals(ctx, actual, expected, message) {
    // return expect(actual, message).to.equal(expected);
}

function doAssertExists(ctx, actual, message) {
    // return expect(actual, message).to.exist;
}

fetchTest.setupFetchTest(
    "deno",
    axios,
    _axios,
    withMockFetch,
    fetchConfigurator,
    getFetch,
)(
    describe,
    testCase,
    doAssert,
    doAssertEquals,
    doAssertExists,
    (ctx, op) => {
        op.bind(ctx);
        return op;
    },
)
