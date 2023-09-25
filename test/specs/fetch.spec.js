/*global __fetchSuite*/
// noinspection UnnecessaryLocalVariableJS

/**
 * @type {function(
 *  platform: string,
 *  axios: object,
 *  axiosModule: object,
 *  withMockFetch: function(),
 *  fetchConfigurator: function(),
 *  getFetch: function()
 * )}
 */
let __fetchSuite = window.__fetchSuite;

function runFetchTestsuite() {
    async function testCase(ctx, input, label, asyncOperation) {
        it(label, function (done) {
            let promise = asyncOperation.bind(ctx)(done);
            if (promise && promise instanceof Promise) {
                promise.then(done, (err) => {
                    throw err;
                });
            }
        })
    }

    function describer(label, asyncDescription) {
        describe(label, function () {
            asyncDescription.bind(this)(null).catch((err) => {
                throw err;
            });
        })
    }

    function doAssert(ctx, condition, message) {
        expect.bind(ctx)(condition).toBeTruthy(message);
    }

    function expectEqual(ctx, actual, expected, message) {
        expect.bind(ctx)(actual).toEqual(expected, message);
    }

    function expectDefined(ctx, actual, message) {
        expect.bind(ctx)(actual).toBeDefined(message);
    }

    function testFactory(ctx, test) {
        return test;  // execute as function
    }

    function configuredAxios(input, cfg) {
        return axios(input, cfg || fetchConfigurator());
    }

    function browserSpecificTests() {
        describe('browser-specific fetch tests', function () {
            beforeEach(function () {
                window.setupMockFetch();
            })

            it('should translate relative URL to same-origin request', function (done) {
                const origin = window.location.origin;

                configuredAxios('/foo').then(function () {
                    expect(getFetch().input.url).toBe(`${origin}/foo`);
                    done();
                });
            });

            afterEach(function () {
                window.teardownMockFetch();
            })
        });
    }

    __fetchSuite(
        "browser",
        configuredAxios,
        axios,
        window.withMockFetch,
        window.fetchConfigurator,
        window.getFetchAsync,
    )(
        describer,
        testCase,
        doAssert,
        expectEqual,
        expectDefined,
        testFactory,
        window.setupMockFetch,
        window.teardownMockFetch,
    );

    browserSpecificTests();
}

runFetchTestsuite();

// describe('browser fetch', function () {
//   beforeEach(function () {
//     setupMockFetch();
//   });
//
//   // not yet supported
//   // it('should support fetching by Request object', function (done) {
//   //   const url = new URL('https://stubbed_domain.local:1/foo');
//   //   const req = new Request(url);
//   //
//   //   axios(req, fetchConfigurator()).then(function () {
//   //     expect(getFetch().input.url).toBe('https://stubbed_domain.local:1/foo');
//   //     done();
//   //   }, function () {
//   //     throw new Error('should not happen');
//   //   });
//   // });
//
//   afterEach(function () {
//     teardownMockFetch();
//   });
// });
