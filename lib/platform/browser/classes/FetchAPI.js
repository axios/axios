
// In browser environments, we directly use the native Fetch API implementation, attached at `window`.

const FetchHeaders = window.Headers;
const FetchRequest = window.Request;
const FetchResponse = window.Response;
const fetcher = window.fetch;

export {
    fetcher,
    FetchHeaders as Headers,
    FetchRequest as Request,
    FetchResponse as Response,
}

export default fetcher;
