
// On Node, we use the `cross-fetch` package as a fetch implementation; this keeps the API consistent with the browser
// and pure-JS environments.

import fetch, {
    Headers as FetchHeaders,
    Request as FetchRequest,
    Response as FetchResponse,
} from 'cross-fetch';

export {
    FetchHeaders as Headers,
    FetchRequest as Request,
    FetchResponse as Response,
}

export default fetch;
