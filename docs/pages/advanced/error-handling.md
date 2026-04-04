# Error handling

axios may throw many different types of errors. Some of these errors are caused by axios itself, while others are caused by the server or the client. The following table lists the general structure of the thrown error:

| Property | Definition                                                                                                                                    |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| message  | A quick summary of the error message and the status it failed with.                                                                           |
| name     | This defines where the error originated from. For axios, it will always be an `AxiosError`.                                                   |
| stack    | Provides the stack trace of the error.                                                                                                        |
| config   | An axios config object with specific instance configurations defined by the user from when the request was made.                              |
| code     | Represents an axios identified error. The table below lists out specific definitions for internal axios error.                                |
| status   | HTTP response status code. See [here](https://en.wikipedia.org/wiki/List_of_HTTP_status_codes) for common HTTP response status code meanings. |

Below is a list of potential axios identified error

| Code                      | Definition                                                                                    |
| ------------------------- | --------------------------------------------------------------------------------------------- |
| ERR_BAD_OPTION_VALUE      | Invalid or unsupported value provided in axios configuration.                                 |
| ERR_BAD_OPTION            | Invalid option provided in axios configuration.                                               |
| ECONNABORTED              | Request timed out due to exceeding timeout specified in axios configuration.                  |
| ETIMEDOUT                 | Request timed out due to exceeding default axios timelimit.                                   |
| ERR_NETWORK               | Network-related issue.                                                                        |
| ERR_FR_TOO_MANY_REDIRECTS | Request is redirected too many times; exceeds max redirects specified in axios configuration. |
| ERR_DEPRECATED            | Deprecated feature or method used in axios.                                                   |
| ERR_BAD_RESPONSE          | Response cannot be parsed properly or is in an unexpected format.                             |
| ERR_BAD_REQUEST           | Requested has unexpected format or missing required parameters.                               |
| ERR_CANCELED              | Feature or method is canceled explicitly by the user.                                         |
| ERR_NOT_SUPPORT           | Feature or method not supported in the current axios environment.                             |
| ERR_INVALID_URL           | Invalid URL provided for axios request.                                                       |

## Handling errors

The default behaviour of axios is to reject the promise if the request fails. However, you can also catch the error and handle it as you see fit. Below is an example of how to catch an error:

```js
axios.get("/user/12345").catch(function (error) {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.log(error.response.data);
    console.log(error.response.status);
    console.log(error.response.headers);
  } else if (error.request) {
    // The request was made but no response was received
    // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
    // http.ClientRequest in node.js
    console.log(error.request);
  } else {
    // Something happened in setting up the request that triggered an Error
    console.log("Error", error.message);
  }
  console.log(error.config);
});
```

Using the `validateStatus` config option, you can override the default condition (status >= 200 && status < 300) and define HTTP code(s) that should throw an error.

```js
axios.get("/user/12345", {
  validateStatus: function (status) {
    return status < 500; // Resolve only if the status code is less than 500
  },
});
```

Using the `toJSON` method, you can get a object with more information about the error.

```js
axios.get("/user/12345").catch(function (error) {
  console.log(error.toJSON());
});
```
