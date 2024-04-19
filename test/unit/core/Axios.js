import Axios from "../../../lib/core/Axios.js";
import assert from "assert";


describe('Axios', function () {
    it('should support errors with un-writable stack', async function () {
        const axios = new Axios({});
        // mock axios._request to return an Error with an un-writable stack property
        axios._request = () => {
            const mockError = new Error("test-error");
            Object.defineProperty(mockError, "stack", {value: {}, writable: false});
            throw mockError;
        }
        try {
            await axios.request("test-url", {})
        } catch (e) {
            assert.strictEqual(e.message, "test-error")
        }
    })
});
