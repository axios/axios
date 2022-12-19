/**
 * @fileoverview Provides type definitions for types and functions used by the Fetch TCK (abstract test-suite). See the
 *   `fetch_abstract.js` definition of the test suite for use of these types.
 */

/**
 * Defines a function which installs the Fetch mock for a given environment, executes a test, then uninstalls the mock.
 *
 * @typedef {function(!Function): Promise<void>}
 */
let MockFetchFn;

/**
 * Defines a function which is able to transform or mutate the Axios configuration before running a test; it is this
 * function's job to inject the adapter under test when testing a specific adapter.
 *
 * @typedef {function(!CreateAxiosDefaults): !AxiosRequestConfig}
 */
let FetchConfiguratorFn;

/**
 * Defines the shape of inputs returned when retrieving a previously-placed invocation to the fetch mock. This shape is
 * provided by the abstract test suite. Inputs to the Axios fetch adapter are always translated to a `Request` object.
 *
 * @typedef {Request}
 */
let AxiosMockFetchInputs;

/**
 * Defines the shape returned by `getFetch` when retrieving a mocked fetch call. This call identifies the inputs and
 * options effectively provided to the underlying fetch implementation by the Axios fetch adapter.
 *
 * Only the types used by the testsuite are defined here.
 *
 * @typedef {{
 *     input: !AxiosMockFetchInputs,
 *     options: !FetchOptions,
 *     FetchAdapter: !AxiosFetchAdapter
 * }}
 */
let MockFetchCall;

/**
 * Defines a function which is able to retrieve the last-submitted Fetch call after a call to the mock fetch shim; the
 * call must be safe when invoked from concurrent tests.
 *
 * @typedef {function(): Promise<!MockFetchCall>}
 */
let FetchGetter;

/**
 * Function which describes the outer test-suite for a given run. This function corresponds to the `describe` function
 * in frameworks like Jasmine and Mocha. It is called by the abstract test suite like so:
 *
 * ```
 * describe("a section of tests", testFactory(this, async function (t) {
 *     // ...
 * });
 * ```
 *
 * Some notes about the suite describer function:
 * - Before and after hooks are called before *all suites* and after *all suites*.
 * - If you are using a framework which depends on preserved context, make sure to hook in and bind here.
 *
 * @typedef {function(string, !Function): void}
 */
let TestSuiteDescriber;

/**
 * Type alias for test case context; some frameworks, such as Jasmine, require the test case function to be bound to the
 * same context as is active in the suite function.
 *
 * @typedef {*}
 */
let TestCaseContext;

/**
 * Type alias for test suite executor input; some frameworks or runtimes, such as Deno, require a parameter to be passed
 * to the test suite function, which is then used to perform various actions in the test case.
 *
 * It's up to the test implementation bindings to care about the type of this parameter. It is defined here for
 * consistency and documentation.
 *
 * @typedef {*}
 */
let TestSuiteInput;

/**
 * Type alias for test case executor input; some frameworks, such as Jasmine, require a parameter to be passed to the
 * test case function, which is then used to signal the completion of asynchronous work.
 *
 * It's up to the test implementation bindings to care about the type of this parameter. It is defined here for
 * consistency and documentation.
 *
 * @typedef {*}
 */
let TestCaseInput;

/**
 * Describes the shape of a test case definition function; this is the async function passed to the `TestCaseDescriber`
 * which actually implements a given test case.
 *
 * The inner test case method must always return a promise. How this promise is executed depends on the test framework
 * bindings installed for the suite.
 *
 * @typedef {function(?TestCaseInput): Promise<void>}
 */
let TestCaseDefinition;

/**
 * Function which describes a single test case within a test suite; a test suite must always exist for every test case
 * (some frameworks, like Jasmine, require context to be preserved). This function corresponds to the `it` function in
 * frameworks like Jasmine and Mocha. It is called by the abstract test suite like so:
 *
 * ```
 * describe("a section of tests", testFactory(this, async function (t) {
 *     await it(this, t, "should do something", async function () {  // <-- this is the test case describer
 *         // ...
 *     });
 * });
 * ```
 *
 * Some notes about the test case describer:
 * - It is always called within the scope of a `describe` (`TestSuiteDescriber`) call.
 * - The first parameter of the `describe` call is always passed to the test case describer. Some frameworks (i.e. Deno)
 *   use this parameter to declare test cases within a section. Others don't use it, and it can just be ignored.
 * - The test suite describer is always expected to return a promise, or be an `async` function. How it resolves async
 *   tests is up to the developer or framework in use. `done` functions are fine, so long as they function within the
 *   scope of the returned promise, and conclude with the promise.
 * - Within the scope of the test execution itself, mock functions are guaranteed to have run, and cleanup is guaranteed
 *   to happen whether the test fails or succeeds.
 *
 * @typedef {function(
 *     context: !TestCaseContext,
 *     suiteInput: ?TestSuiteInput,
 *     label: !string,
 *     definition: !TestCaseDefinition
 * )}
 */
let TestCaseDescriber;

/**
 * Test assertion primitive: can be a raw value or a function.
 *
 * If the assertion is a function, it will be executed within the context of the current test, and the resulting output
 * value used as the comparison base.
 *
 * @typedef {(!Function|*)}
 */
let TestAssertionComponent;

/**
 * Test assertion function: condition and message.
 *
 * This function implements basic conditional test assertions in the form of:
 * ```
 * assert(condition === true, "condition was supposed to be true");
 * ```
 *
 * Two parameters are accepted:
 *
 * - `condition`: the condition to assert. If this condition is not true, the test will fail.
 * - `message`: the message to display if the condition is not true. optional.
 *
 * **Note:** Except where otherwise noted, the `condition` parameter can be a function, in which case the function is
 * executed before the assertion is made; in this case, the function's return value is used as the base for comparison.
 *
 * @typedef {function(condition: TestAssertionComponent, opt_message: ?string): void}
 */
let TestAsserter;

/**
 * Test assertion function: equality check.
 *
 * This function implements basic equality assertions in the form of:
 * ```
 * assertEquals(x, y, "`x` should equal `y`");
 * ```
 *
 * Three parameters are accepted:
 * - `expected`: the first value to compare, signifying the value which is/was expected.
 * - `actual`: the second value to compare, signifying the value which was actually received.
 * - `message`: the message to display if the values are not equal. optional.
 *
 * **Note:** Except where otherwise noted, the `expected` and `actual` parameters can be functions, in which case the
 * functions are executed before the assertion is made; in this case, the function's return value is used as the base
 * for comparison.
 *
 * @typedef {function(expected: TestAssertionComponent, actual: TestAssertionComponent, opt_message: ?string): void}
 */
let TestEqualsAsserter;

/**
 * Test assertion function: existence check.
 *
 * This function implements basic existence assertions in the form of:
 * ```
 * assertExists(x, "`x` should exist");
 * ```
 *
 * The value under test is guaranteed not to be `null`, `undefined`, or `NaN`. Two parameters are accepted:
 * - `value`: the value to test for existence.
 * - `message`: the message to display if the value does not exist. optional.
 *
 * **Note:** Except where otherwise noted, the `value` parameter can be a function, in which case the function is
 * executed before the assertion is made; in this case, the function's return value is used as the base for comparison.
 *
 * @typedef {function(value: TestAssertionComponent, opt_message: ?string): void}
 */
let TestExistsAsserter;

/**
 * Test factory function; this function is called with each test suite created by a test run. A test factory can be
 * provided by the test bindings in order to customize the suite function before execution. Optional.
 *
 * The test factory receives the test right before the `TestSuiteDescriber` is called. The resulting definition function
 * is the unmodified output of this function.
 *
 * @typedef {function(
 *    context: !TestCaseContext,
 *    suiteInput: ?TestSuiteInput
 * ): !TestCaseDefinition}
 */
let TestFactory;

/**
 * Test hook function: called before any tests are run.
 *
 * This hook can be used to prepare mocks, shared resources, test data, etc., before the test suite is executed.
 *
 * @typedef {function(this: !TestCaseContext): void}
 */
let TestHookBeforeAll;

/**
 * Test hook function: called after all tests have run.
 *
 * This hook can be used to teardown mocks, perform cleanup tasks, close connections, etc., after all tests have
 * concluded.
 *
 * @typedef {function(this: !TestCaseContext): void}
 */
let TestHookAfterAll;

/**
 * Test hook function: called before each test case is run.
 *
 * This hook can be used to prepare mocks, shared resources, test data, etc., before each test case has executed.
 *
 * @typedef {function(this: !TestCaseContext): void}
 */
let TestHookBeforeEach;

/**
 * Test hook function: called after each test case has concluded.
 *
 * This hook can be used to teardown mocks, perform cleanup tasks, close connections, etc., after each test case has
 * concluded. Called whether the test case passes or fails.
 *
 * @typedef {function(this: !TestCaseContext): void}
 */
let TestHookAfterEach;

/**
 * Type definition for the Axios instance under test, which is the static default instance from the Axios module. This
 * instance is both callable as an Axios instance and usable as a static-typed instance.
 *
 * @typedef {Axios & AxiosStatic & (function(): Promise<*>)}
 */
let AxiosTestInstance;

/**
 * Specifies the interface expected for test module entrypoint functions; these are expected to be named `runTest`.
 *
 * @typedef {function({
 *   platformName: !string,
 *   axios: !AxiosTestInstance,
 *   axiosModule: !AxiosModule,
 *   withMockFetch: !MockFetchFn,
 *   fetchConfigurator: !FetchConfiguratorFn,
 *   getFetch: !FetchGetter,
 *   describe: !TestSuiteDescriber,
 *   it: !TestCaseDescriber,
 *   assert: ?TestAsserter,
 *   assertEquals: ?TestEqualsAsserter,
 *   assertExists: ?TestExistsAsserter,
 * }): Promise<void>}
 */
let AxiosTestModule;

/**
 * Type definition for the entire Axios module under test; this should behave like the `axios` package itself, with the
 * same expected exports.
 *
 * @typedef {AxiosStatic & {
 *     axios: !AxiosTestInstance
 * }}
 */
let AxiosModule;

/**
 * Models a function which is wired to execute the Fetch test-suite, but must be provided with test suite, case, and
 * assertion callable.
 *
 * This function is intended to be invoked with bindings into whatever test platform is being used. For example, method
 * bindings may be provided from Mocha, or Jasmine, or Deno, in order to wire a test-suite together for execution.
 *
 * **Note:** To implement before-each/after-each functionality,
 *
 * @typedef {function(
 *   describe: !TestSuiteDescriber,
 *   testCase: !TestCaseDescriber,
 *   assert: ?TestAsserter,
 *   assertEquals: ?TestEqualsAsserter,
 *   assertExists: ?TestExistsAsserter,
 *   testFactory: ?TestFactory,
 *   beforeAll: ?TestHookBeforeAll,
 *   afterAll: ?TestHookAfterAll,
 *   beforeEach: ?TestHookBeforeEach,
 *   afterEach: ?TestHookAfterEach
 * ): Promise<void>}
 */
let ConfiguredSuiteExecutor;
