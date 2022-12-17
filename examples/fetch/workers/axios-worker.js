import axios from "axios";

const moduleMode = true;
const proxyTarget = 'httpbin.org';

// Proxy `request` to `proxyTarget`, but with fetch via Axios.
async function handler(url) {
    return await axios({
        url,
        adapter: 'fetch'
    }).then(response => {
        // translate to a Fetch response
        return new Response(response.data, {
            status: response.status,
            statusText: response.statusText,
            headers: new Headers(response.headers),
        });
    });
}

export default {
    fetch(request) {
        const url = new URL(request.url);
        url.hostname = proxyTarget;
        return handler(url);
    },
};

if (!moduleMode) {
    async function handleRequest(request) {
        const url = new URL(request.url);
        url.hostname = proxyTarget;
        return await handler(url);
    }
    addEventListener('fetch', event => {
        event.respondWith(handleRequest(event.request));
    });
}
