# axios [![Build Status](https://travis-ci.org/mzabriskie/axios.svg?branch=master)](https://travis-ci.org/mzabriskie/axios)

Lightweight Promise based XHR library

## Example

Performing a `GET` request

```js
// Make a request for a user with a given ID
axios.get('/user?ID=12345')
	.success(function (response) {
		console.log(response);
	})
	.error(function (response) {
		console.log(response);
	});
	
// Optionally the request above could also be done as
axios.get('/user', {
	params: {
		ID: 12345
	}
})
.success(function (response) {
	console.log(response);
})
.error(function (response) {
	console.log(response);
});
```

Performing a `POST` request

```js
axios.post('/user', {
	firstName: 'Fred',
	lastName: 'Flintstone'
})
.success(function (response) {
	console.log(response);
})
.error(function (response) {
	console.log(response);
});
```

## Request API

Requests can be made by passing the relevant options to `axios`.

##### axios(options)

```js
axios({
	url: '/user/12345',
	method: 'get'
});
```

### Request method aliases

For convenience aliases have been provided for all supported request methods.

##### axios.get(url[, options])
##### axios.delete(url[, options])
##### axios.head(url[, options])
##### axios.post(url[, data[, options]])
##### axios.put(url[, data[, options]])
##### axios.patch(url[, data[, options]])

###### NOTE
When using the alias methods `url`, `method`, and `data` properties don't need to be specified in options.

### Options

```js
{
	// `url` is the server URL that will be used for the request
	url: '/user',
	
	// `method` is the request method to be used when making the request
	method: 'get',
	
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
	withCredentials: true,
	
	// `responseType` indicates the type of data that the server will responsd with
	// options are 'arraybuffer', 'blob', 'document', 'json', 'text'
	responseType: 'json'
}
```

## Response API

For either `success` or `error`, the following response will be provided.

```js
{
	// `data` is the response that was provided by the server
	data: {/*...*/}	,
	
	// `status` is the HTTP status code from the server response
	status: 200,
	
	// `headers` the headers that the server responded with
	headers: {/*...*/},
	
	// `config` are the options that were provided to `axios` for the request
	config: {/*...*/}
}
```

## Installing

Using bower:

```bash
$ bower install axios
```

Using npm:

```bash
$ npm install axios
```

## Attribution

axios is heavily inspired by Angular's $http service.

## License

MIT