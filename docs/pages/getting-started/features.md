# Features

axios is a powerful HTTP client that provides a simple and easy-to-use API for making HTTP requests. It supports all modern browsers and is widely used in the JavaScript community. Here are some of the features that make axios a great choice for your next project.

## Isomorphic

axios is a universal HTTP client that can be used in both the browser and Node.js. This means you can use axios to make API requests from your frontend code as well as your backend code. This makes axios a great choice for building progressive web apps, single-page applications, and server-side rendered applications.

axios is also a great choice for teams that work on both frontend and backend code. By using axios for both frontend and backend code, you can have a consistent API for making HTTP requests, which can help reduce the complexity of your codebase.

## Fetch support <Badge type="tip" text="New" />

axios provides first class support for the Fetch API, which is a modern replacement for the XHR API. The adapter is optional and can be used through configuration. The same API is maintained for both the XHR and Fetch adapters, which makes it easy to adopt the Fetch API in your codebase without changing your existing code.

## Browser support

axios supports all modern and old browsers, including Chrome, Firefox, Safari, and Edge. axios can be used in browser as old as Internet Explorer 11, which makes it a great choice for building web applications that need to support a wide range of browsers.

## Node.js support

axios also supports a wide range Node.js versions with tested compatibility as far back as v10.x, making it a good choice in environments where upgrading to the latest Node.js version might not be possible or practical.

## Additional features

- Supports the Promise API
- Intercept request and response
- Transform request and response data
- Abort controller
- Timeouts
- Query parameters serialization with support for nested entries
- Automatic request body serialization to:
  - JSON (application/json)
  - Multipart / FormData (multipart/form-data)
  - URL encoded form (application/x-www-form-urlencoded)
- Posting HTML forms as JSON
- Automatic JSON data handling in response
- Progress capturing for browsers and node.js with extra info (speed rate, remaining time)
- Setting bandwidth limits for node.js
- Compatible with spec-compliant FormData and Blob (including node.js)
- Client side support for protecting against XSRF
