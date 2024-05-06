import Axios from "../../../lib/core/Axios.js";
import assert from "assert";

describe('Axios', function () {
  describe("handle unwritable error stack", function () {
    async function testUnwritableErrorStack(initialStackValue) {
      const axios = new Axios({});
      // mock axios._request to return an Error with an un-writable stack property
      axios._request = () => {
        const mockError = new Error("test-error");
        Object.defineProperty(mockError, "stack", {value: initialStackValue, writable: false});
        throw mockError;
      }
      try {
        await axios.request("test-url", {})
      } catch (e) {
        assert.strictEqual(e.message, "test-error")
      }
    }

    it('should support errors with a defined but un-writable stack', async function () {
      await testUnwritableErrorStack({})
    });

    it('should support errors with an undefined and un-writable stack', async function () {
      await testUnwritableErrorStack(undefined)
    });
  })
});
