# axios [![Build Status](https://travis-ci.org/mzabriskie/axios.svg?branch=master)](https://travis-ci.org/mzabriskie/axios)

Promise based HTTP client for the browser and node.js

## Features

- Make [XMLHttpRequests](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest) from the browser
- Make [http](http://nodejs.org/api/http.html) requests from node.js
- Supports the [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) API
- Transform request and response data
- Automatic transforms for JSON data
- Client side support for protecting against [XSRF](http://en.wikipedia.org/wiki/Cross-site_request_forgery)
- Specify HTTP request headers

## Installing

Using bower:

```bash
$ bower install axios
```

Using npm:

```bash
$ npm install axios
```

## Compatibility

Tested to work with >=IE8, Chrome, Firefox, Safari, and Opera.

## Example

Performing a `GET` request

```js
// Make a request for a user with a given ID
axios.get('/user?ID=12345')
	.then(function (response) {
		console.log(response);
	})
	.catch(function (response) {
		console.log(response);
	});
	
// Optionally the request above could also be done as
axios.get('/user', {
		params: {
			ID: 12345
		}
	})
	.then(function (response) {
		console.log(response);
	})
	.catch(function (response) {
		console.log(response);
	});
```

Performing a `POST` request

```js
axios.post('/user', {
		firstName: 'Fred',
		lastName: 'Flintstone'
	})
	.then(function (response) {
		console.log(response);
	})
	.catch(function (response) {
		console.log(response);
	});
```

Aliases are provided for success and error

```js
axios.get('/user/12345')
	.success(function () {
		console.log('user found');
	})
	.error(function () {
		console.log('error finding user');
	});
```

Performing multiple concurrent requests

```js
function getUserAccount() {
	return axios.get('/user/12345');
}

function getUserPermissions() {
	return axios.get('/user/permissions/12345');
}

axios.all([getUserAccount(), getUserPermissions()])
	.then(axios.spread(function (acct, perms) {
		// Both requests are now complete
	}));
```

## axios API

Requests can be made by passing the relevant config to `axios`.

##### axios(config)

```js
axios({
	method: 'get',
	url: '/user/12345'
});
```

### Request method aliases

For convenience aliases have been provided for all supported request methods.

##### axios.get(url[, config])
##### axios.delete(url[, config])
##### axios.head(url[, config])
##### axios.post(url[, data[, config]])
##### axios.put(url[, data[, config]])
##### axios.patch(url[, data[, config]])

###### NOTE
When using the alias methods `url`, `method`, and `data` properties don't need to be specified in config.

### Concurrency

Helper functions for dealing with concurrent requests.

##### axios.all(iterable)
##### axios.spread(callback)

## Request API

This is the available config options for making requests. Only the `url` is required. Requests will default to `GET` if `method` is not specified.

```js
{
	// `url` is the server URL that will be used for the request
	url: '/user',
	
	// `method` is the request method to be used when making the request
	method: 'get', // default
	
	// `transformRequest` allows changes to the request data before it is sent to the server
	// This is only applicable for request methods 'PUT', 'POST', and 'PATCH'
	transformRequest: [function (data) {
		// Do whatever you want to transform the data
		
		return data;
	}],
	
	// `transformResponse` allows changes to the response data to be made before
	// it is passed to the success/error handlers
	transformResponse: [function (data) {
		// Do whatever you want to transform the data
		
		return data;
	}],
	
	// `headers` are custom headers to be sent
	headers: {'X-Requested-With': 'XMLHttpRequest'},
	
	// `param` are the URL parameters to be sent with the request
	params: {
		ID: 12345
	},
	
	// `data` is the data to be sent as the request body
	// Only applicable for request methods 'PUT', 'POST', and 'PATCH'
	data: {
		firstName: 'Fred'
	},
	
	// `withCredentials` indicates whether or not cross-site Access-Control requests
	// should be made using credentials
	withCredentials: false, // default
	
	// `responseType` indicates the type of data that the server will respond with
	// options are 'arraybuffer', 'blob', 'document', 'json', 'text'
	responseType: 'json', // default
	
	// `xsrfCookieName` is the name of the cookie to use as a value for xsrf token
	xsrfCookieName: 'XSRF-TOKEN', // default
	
	// `xsrfHeaderName` is the name of the http header that carries the xsrf token value
	xsrfHeaderName: 'X-XSRF-TOKEN' // default
}
```

## Response API

The response for a request contains the following information.

```js
{
	// `data` is the response that was provided by the server
	data: {},
	
	// `status` is the HTTP status code from the server response
	status: 200,
	
	// `headers` the headers that the server responded with
	headers: {},
	
	// `config` is the config that was provided to `axios` for the request
	config: {}
}
```

When using `then` or `catch`, you will receive a single response object.

```js
axios.get('/user/12345')
	.then(function(response) {
		console.log(response.data);
		console.log(response.status);
		console.log(response.headers);
		console.log(response.config);
	});
```

For either `success` or `error`, the response is broken up into individual arguments.

```js
axios.get('/user/12345')
	.success(function (data, status, headers, config) {
		console.log(data);
		console.log(status);
		console.log(headers);
		console.log(config);
	});
}
```

## Credits

axios is heavily inspired by the [$http service](https://docs.angularjs.org/api/ng/service/$http) provided in [Angular](https://angularjs.org/). Ultimately axios is an effort to provide a standalone `$http`-like service for use outside of Angular.

axios uses the [es6-promise](https://github.com/jakearchibald/es6-promise) polyfill by [Jake Archibald](https://github.com/jakearchibald). Until we [can use](http://caniuse.com/promises) ES6 Promises natively in all browsers, this polyfill is a life saver.

## License

MIT