# Axios Library - GitHub Copilot Instructions

## Project Overview

Axios is a promise-based HTTP client for the browser and Node.js. It provides a simple, elegant API for making HTTP requests with features like interceptors, request/response transformation, automatic JSON data handling, and request cancellation.

## Core Architecture

### Module Structure

- **ES6 Modules**: The library uses ES6 import/export syntax throughout
- **Platform Abstraction**: Code is organized to support both browser and Node.js environments via the `platform/` directory
- **Adapter Pattern**: HTTP requests are handled through adapters (XHR, HTTP, Fetch) selected based on the environment

### Key Components

#### 1. Core Classes (`lib/core/`)

- **Axios**: Main class that manages request dispatching and interceptor chains
- **AxiosError**: Custom error class with standardized error codes (ERR_NETWORK, ETIMEDOUT, etc.)
- **AxiosHeaders**: Manages HTTP headers with case-insensitive access and normalization
- **InterceptorManager**: Handles request/response interceptors with synchronous/asynchronous support

#### 2. Adapters (`lib/adapters/`)

- **xhr.js**: XMLHttpRequest adapter for browsers
- **http.js**: Node.js HTTP/HTTPS adapter
- **fetch.js**: Fetch API adapter
- Adapters are selected automatically based on environment capabilities

#### 3. Utilities (`lib/utils.js`)

- Comprehensive type checking functions (isArray, isObject, isString, etc.)
- Object manipulation utilities (merge, extend, forEach)
- Platform-agnostic helper functions
- Uses functional programming patterns with pure functions

#### 4. Helpers (`lib/helpers/`)

- URL building and parameter serialization
- Form data handling and conversion
- Progress event management
- Request/response transformation utilities

## Coding Conventions

### Code Style

1. **Strict Mode**: Always use `'use strict';` at the top of files
2. **Function Documentation**: Use JSDoc comments for all public functions with @param and @returns tags
3. **Import Style**: Use named imports from relative paths with `.js` extension
4. **Error Handling**: Always use AxiosError with appropriate error codes
5. **Null Checks**: Use explicit checks (`=== null`, `!== undefined`) rather than truthy/falsy checks where precision matters

### Naming Conventions

- **Classes**: PascalCase (e.g., `Axios`, `AxiosError`, `InterceptorManager`)
- **Functions**: camelCase (e.g., `buildURL`, `mergeConfig`, `dispatchRequest`)
- **Constants**: UPPER_SNAKE_CASE for error codes (e.g., `ERR_NETWORK`, `ETIMEDOUT`)
- **Private symbols**: Use Symbol for internal properties (e.g., `$internals`)
- **Helper functions**: Prefix with underscore for internal helpers (e.g., `_request`)

### Error Handling Patterns

```javascript
// Always use AxiosError for library errors
throw new AxiosError(message, code, config, request, response);

// Predefined error codes
AxiosError.ERR_BAD_REQUEST;
AxiosError.ERR_NETWORK;
AxiosError.ETIMEDOUT;
AxiosError.ECONNABORTED;
AxiosError.ERR_CANCELED;
```

### Configuration Patterns

- Use `mergeConfig()` to combine configuration objects
- Support both function and object forms for serializers
- Validate options using the `validator` helper
- Apply defaults from `lib/defaults/index.js`

## Important Design Patterns

### 1. Interceptor Chain Pattern

```javascript
// Interceptors execute in a specific order:
// Request interceptors (last registered -> first registered)
// Actual request
// Response interceptors (first registered -> last registered)

// Support both synchronous and asynchronous interceptors
interceptors.request.use(onFulfilled, onRejected, {
  synchronous: false,
  runWhen: (config) => config.custom === true,
});
```

### 2. Adapter Selection

- Adapters are tried in order: ['xhr', 'http', 'fetch']
- Use capability detection, not environment detection
- Each adapter returns a Promise

### 3. Request/Response Transformation

```javascript
// Transformations are applied in arrays
transformRequest: [function(data, headers) {
  // Transform request data
  return data;
}],
transformResponse: [function(data) {
  // Transform response data
  return data;
}]
```

### 4. Config Merging Strategy

- Deep merge for nested objects
- Header normalization and flattening
- Method-specific headers override common headers

## Platform Abstraction

### Browser vs Node.js

- **Browser**: Uses XHR or Fetch adapter, includes XSRF protection
- **Node.js**: Uses HTTP/HTTPS adapter, supports streams
- Platform-specific classes in `lib/platform/browser/` and `lib/platform/node/`

### Environment Detection

```javascript
// Check feature availability, not environment name
const isXHRAdapterSupported = typeof XMLHttpRequest !== "undefined";
```

## Testing Considerations

- Functions should be pure and testable in isolation
- Use dependency injection for platform-specific features
- Mock adapters for unit tests
- Support for cancellation should be tested thoroughly

## Common Pitfalls to Avoid

1. **Don't** use global variables or singletons
2. **Don't** assume browser or Node.js specific APIs are available
3. **Don't** mutate configuration objects - always return new objects
4. **Don't** throw generic Error objects - use AxiosError
5. **Don't** use `.bind()` without the helper function from `lib/helpers/bind.js`
6. **Don't** add new dependencies without discussion

## Type Safety Notes

- The library includes TypeScript definitions (index.d.ts)
- Maintain compatibility with existing type definitions
- Use utils type checking functions consistently (utils.isArray, utils.isString, etc.)

## Performance Considerations

- Minimize object allocations in hot paths
- Reuse headers objects when possible
- Use efficient string operations
- Avoid unnecessary array iterations
- Cache compiled regular expressions

## Request Lifecycle

1. **Request Creation**: User calls `axios()` or `axios.get/post()` etc.
2. **Config Merging**: Merge instance defaults with request config
3. **Request Interceptors**: Execute in reverse order of registration
4. **Adapter Selection**: Choose appropriate adapter for environment
5. **Request Transformation**: Apply transformRequest functions
6. **HTTP Request**: Adapter performs actual HTTP request
7. **Response Transformation**: Apply transformResponse functions
8. **Response Interceptors**: Execute in order of registration
9. **Promise Resolution**: Return response or throw error

## Cancellation Patterns

- Support both CancelToken (legacy) and AbortSignal (modern)
- Always cleanup listeners to prevent memory leaks
- Cancel should work at any stage of the request

## Common Helper Usage

### URL Building

```javascript
import buildURL from "./helpers/buildURL.js";
const url = buildURL(baseURL, params, paramsSerializer);
```

### Header Management

```javascript
import AxiosHeaders from "./core/AxiosHeaders.js";
const headers = AxiosHeaders.from(rawHeaders).normalize();
```

### Type Checking

```javascript
import utils from "./utils.js";
if (utils.isObject(data) && !utils.isStream(data)) {
  // Handle object data
}
```

## When Adding New Features

1. Consider both browser and Node.js environments
2. Add appropriate error codes if needed
3. Update TypeScript definitions
4. Maintain backward compatibility
5. Add JSDoc documentation
6. Consider performance implications
7. Test with interceptors and transformations
8. Validate configuration options properly

## Priority Guidelines

When suggesting code:

1. **Compatibility First**: Maintain backward compatibility
2. **Platform Agnostic**: Work in both browser and Node.js
3. **Error Handling**: Use AxiosError consistently
4. **Documentation**: Include JSDoc comments
5. **Performance**: Avoid unnecessary operations
6. **Type Safety**: Use utils type checking consistently

## Code Examples to Follow

### Creating a New Helper

```javascript
"use strict";

import utils from "../utils.js";

/**
 * Brief description of what this helper does
 *
 * @param {Type} paramName - Description
 * @returns {ReturnType} Description
 */
export default function helperName(paramName) {
  // Validate inputs
  if (!utils.isString(paramName)) {
    throw new TypeError("paramName must be a string");
  }

  // Implementation
  return result;
}
```

### Creating a New Core Class

```javascript
"use strict";

import utils from "../utils.js";

/**
 * Class description
 */
class ClassName {
  constructor(config) {
    this.config = config || {};
  }

  /**
   * Method description
   *
   * @param {Type} param - Description
   * @returns {ReturnType} Description
   */
  methodName(param) {
    // Implementation
  }
}

export default ClassName;
```

### Error Handling Pattern

```javascript
import AxiosError from "../core/AxiosError.js";

// Throw with context
throw new AxiosError(
  "Descriptive error message",
  AxiosError.ERR_APPROPRIATE_CODE,
  config,
  request,
  response
);

// Create from existing error
const axiosError = AxiosError.from(error, code, config, request, response);
```

## Summary

When working with Axios code, prioritize compatibility, use the established patterns for error handling and configuration, leverage the utils library for type checking, and ensure code works across both browser and Node.js environments. Always document your code with JSDoc and maintain the functional programming style used throughout the library.
