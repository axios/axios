import axios from './index.js';
import http from 'http';


async function testTimeout() {
    try {
        console.log('Sending request with timeout...');
        // Request to a non-routable IP to force timeout (or use a delay service if internet available, but better to use local mock or something that hangs)
        // Actually, I can use a local server that delays response.
        // Or just use a very short timeout on a slow endpoint.
        // Since I don't have internet access for arbitrary URLs, I should use a local server.

        // Let's start a simple http server that delays response
        const server = http.createServer((req, res) => {
            setTimeout(() => {
                res.writeHead(200);
                res.end('Hello World');
            }, 2000);
        });

        await new Promise(resolve => server.listen(0, resolve));
        const port = server.address().port;
        const url = `http://localhost:${port}`;

        console.log(`Server listening on ${url}`);

        await axios.get(url, { timeout: 1000 });
        console.log('Request success (unexpected)');
        server.close();
    } catch (error) {
        if (error.code === 'ECONNABORTED') {
            console.log('Caught expected timeout error: ECONNABORTED');
        } else if (error.code === 'ETIMEDOUT') {
            console.log('Caught expected timeout error: ETIMEDOUT');
        } else {
            console.log('Caught unexpected error:', error.message);
            console.log('Error code:', error.code);
        }
        // Clean up
        process.exit(0);
    }
}

testTimeout();
