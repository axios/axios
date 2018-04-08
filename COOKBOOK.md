# Cookbook

In an effort to keep axios as light weight as possible, and to avoid a rats nest of code for supporting every possible integration, it is often necessary to say no to feature requests. This doesn't mean that those use cases aren't legitimate, but rather that they are easily supported by augmenting axios with other libraries.

The following are the recipes for some of the commonly requested features.

### Promise.prototype.done

```bash
$ npm install axios promise --save
```

```js
const axios = require('axios');
require('promise/polyfill-done');

axios
  .get('http://www.example.com/user')
  .then((response) => {
    console.log(response.data);
    return response;
  })
  .done();
```

### Promise.prototype.finally

```bash
$ npm install axios promise.prototype.finally --save
```

```js
const axios = require('axios');
require('promise.prototype.finally').shim();

axios
  .get('http://www.example.com/user')
  .then((response) => {
    console.log(response.data);
    return response;
  })
  .finally(() => {
    console.log('this will always be called');
  });
```

### Inflate/Deflate

```bash
$ npm install axios pako --save
```

```js
// client.js
const axios = require('axios');
const pako = require('pako');

const user = {
  firstName: 'Fred',
  lastName: 'Flintstone'
};

const data = pako.deflate(JSON.stringify(user), { to: 'string' });

axios
  .post('http://127.0.0.1:3333/user', data)
  .then((response) => {
    response.data = JSON.parse(pako.inflate(response.data, { to: 'string' }));
    console.log(response.data);
    return response;
  });
```

```js
// server.js
const pako = require('pako');
const http = require('http');
const url = require('url');

const server = http.createServer((req, res) => {
  req.setEncoding('utf8');

  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;

  if (pathname === '/user') {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });

    req.on('end', () => {
      const user = JSON.parse(pako.inflate(data, { to: 'string' }));
      console.log(user);

      res.writeHead(200, {
        'Content-Type': 'application/json'
      });
      res.end(pako.deflate(JSON.stringify({result: 'success'}), { to: 'string' }));
    });
  } else {
    res.writeHead(404);
    res.end(pako.deflate(JSON.stringify({result: 'error'}), { to: 'string' }));
  }
});

server.listen(3333);
```

### JSONP

```bash
$ npm install jsonp --save
```

```js
const jsonp = require('jsonp');

jsonp('http://www.example.com/foo', null, (err, data) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log(data);
  }
});
```
