import axios from "axios/generic";

const proxyTarget = 'axios-fetch.elide.dev';

function applyCorsHeaders(headers) {
    const mutable = new Headers(headers);
    mutable.set('Access-Control-Allow-Origin', '*');
    mutable.set('Access-Control-Allow-Methods', 'GET');
    mutable.set('Access-Control-Max-Age', '86400');
    mutable.set('Content-Type', 'application/javascript');
    mutable.set('Cache-Control', 'public, max-age=31536000, s-max-age=31536000, immutable');
    mutable.set('Cross-Origin-Resource-Policy', 'cross-origin');
    return mutable;
}

// Proxy `request` to `proxyTarget`, but with fetch via Axios. Add CORS headers so that we can serve the Axios library
// itself as an ESM module (the Elide endpoint which handles this request is itself using the Axios branch).
async function handler(request) {
    // no favicon
    if (request.url.endsWith('/favicon.ico')) return new Response(null, {status: 404});

    // proxy the request to `proxyTarget`, where the axios library fork is hosted
    const url = new URL(`https://${proxyTarget}${new URL(request.url).pathname}`);
    url.hostname = proxyTarget;
    request = new Request(url, request);
    request.headers.set('Origin', url.origin);

    try {
        console.log(`Fetching Axios library at URL '${url.toString()}'`);
        const response = await axios.get(url, {
            adapter: 'fetch',
            timeout: 1000,
            responseType: 'text',
            headers: {
                'Accept': 'application/javascript, text/javascript, */*',
                'Accept-Encoding': 'identity',
                'Origin': url.origin,
            }
        });

        // translate to a Fetch response
        return new Response(response.data, {
            status: response.status,
            statusText: response.statusText,
            headers: applyCorsHeaders(response.headers),
        });

    } catch (err) {
        console.error(
            `Error encountered while fetching Axios library via Axios`,
            url,
            err
        );
        return new Response(`Error`, {
            status: 500,
            headers: applyCorsHeaders(new Headers()),  // open up errors so that the user's console is accurate
        })
    }
}

export default {
    async fetch(request) {
        return await handler(request);
    },
};
