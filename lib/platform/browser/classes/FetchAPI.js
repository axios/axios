
// In browser environments, we directly use the native Fetch API implementation, attached at `window`.

const FetchHeaders = window.Headers;
const FetchRequest = window.Request;
const FetchResponse = window.Response;
const fetch = window.fetch;

export {
    FetchHeaders as Headers,
    FetchRequest as Request,
    FetchResponse as Response,
}

export default fetch;
