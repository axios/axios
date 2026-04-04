# API reference

Below is a list of all the available functions and classes in the axios package. These functions may be used and imported in your project. All of these functions and classes are protected by our renewed promise to follow semantic versioning. This means that you can rely on these functions and classes to remain stable and unchanged in future releases unless a major version change is made.

## Instance

The `axios` instance is the main object that you will use to make HTTP requests. It is a factory function that creates a new instance of the `Axios` class. The `axios` instance has a number of methods that you can use to make HTTP requests. These methods are documented in the [Request aliases section](/pages/advanced/request-method-aliases) of the documentation.

## Classes

### `Axios`

The `Axios` class is the main class that you will use to make HTTP requests. It is a factory function that creates a new instance of the `Axios` class. The `Axios` class has a number of methods that you can use to make HTTP requests. These methods are documented in the [Request aliases section](/pages/advanced/request-method-aliases) of the documentation.

#### `constructor`

Creates a new instance of the `Axios` class. The constructor takes an optional configuration object as an argument.

```ts
constructor(instanceConfig?: AxiosRequestConfig);
```

#### `request`

Handles request invocation and response resolution. This is the main method that you will use to make HTTP requests. It takes a configuration object as an argument and returns a promise that resolves to the response object.

```ts
request(configOrUrl: string | AxiosRequestConfig<D>, config: AxiosRequestConfig<D>): Promise<AxiosResponse<T>>;
```

### `CancelToken` <Badge type="danger" text="Deprecated in favour of AbortController" />

The `CancelToken` class was based on the `tc39/proposal-cancelable-promises` proposal. It was used to create a token that could be used to cancel an HTTP request. The `CancelToken` class is now deprecated in favour of the `AbortController` API.

As of version 0.22.0, the `CancelToken` class is deprecated and will be removed in a future release. It is recommended that you use the `AbortController` API instead.

The class is exported mainly for backwards compatibility and will be removed in a future release. We also strongly discourage its use in new projects, we therefore are not documenting the API as use is discouraged.

## Functions

### `AxiosError`

The `AxiosError` class is an error class that is thrown when an HTTP request fails. It extends the `Error` class and adds additional properties to the error object.

#### `constructor`

Creates a new instance of the `AxiosError` class. The constructor takes an optional message, code, config, request, and response as arguments.

```ts
constructor(message?: string, code?: string, config?: InternalAxiosRequestConfig<D>, request?: any, response?: AxiosResponse<T, D>);
```

#### `properties`

The `AxiosError` class provides the following properties:

```ts
// Config instance.
config?: InternalAxiosRequestConfig<D>;

// Error code.
code?: string;

// Request instance.
request?: any;

// Response instance.
response?: AxiosResponse<T, D>;

// Boolean indicating if the error is an `AxiosError`.
isAxiosError: boolean;

// Error status code.
status?: number;

// Helper method to convert the error to a JSON object.
toJSON: () => object;

// Error cause.
cause?: Error;
```

### `AxiosHeaders`

The `AxiosHeaders` class is a utility class that is used to manage HTTP headers. It provides methods for manipulating headers, such as adding, removing, and getting headers.

Only the main methods are documented here. For a full list of methods, please refer to the type declaration file.

#### `constructor`

Creates a new instance of the `AxiosHeaders` class. The constructor takes an optional headers object as an argument.

```ts
constructor(headers?: RawAxiosHeaders | AxiosHeaders | string);
```

#### `set`

Adds a header to the headers object.

```ts
set(headerName?: string, value?: AxiosHeaderValue, rewrite?: boolean | AxiosHeaderMatcher): AxiosHeaders;
set(headers?: RawAxiosHeaders | AxiosHeaders | string, rewrite?: boolean): AxiosHeaders;
```

#### `get`

Gets a header from the headers object.

```ts
get(headerName: string, parser: RegExp): RegExpExecArray | null;
get(headerName: string, matcher?: true | AxiosHeaderParser): AxiosHeaderValue;
```

#### `has`

Checks if a header exists in the headers object.

```ts
has(header: string, matcher?: AxiosHeaderMatcher): boolean;
```

#### `delete`

Removes a header from the headers object.

```ts
delete(header: string | string[], matcher?: AxiosHeaderMatcher): boolean;
```

#### `clear`

Removes all headers from the headers object.

```ts
clear(matcher?: AxiosHeaderMatcher): boolean;
```

#### `normalize`

Normalizes the headers object.

```ts
normalize(format: boolean): AxiosHeaders;
```

#### `concat`

Concatenates headers objects.

```ts
concat(...targets: Array<AxiosHeaders | RawAxiosHeaders | string | undefined | null>): AxiosHeaders;
```

#### `toJSON`

Converts the headers object to a JSON object.

```ts
toJSON(asStrings?: boolean): RawAxiosHeaders;
```

### `CanceledError` <Badge type="tip" text="Extended AxiosError" />

The `CanceledError` class is an error class that is thrown when an HTTP request is canceled. It extends the `AxiosError` class.

### `Cancel` <Badge type="tip" text="Alias for CanceledError" />

The `Cancel` class is an alias for the `CanceledError` class. It is exported for backwards compatibility and will be removed in a future release.

### `isCancel`

A function that checks if an error is a `CanceledError`.

### `isAxiosError`

A function that checks if an error is an `AxiosError`.

### `all` <Badge type="danger" text="Deprecated in favour of Promise.all" />

The `all` function is a utility function that takes an array of promises and returns a single promise that resolves when all of the promises in the array have resolved. The `all` function is now deprecated in favour of the `Promise.all` method. It is recommended that you use the `Promise.all` method instead.

As of version 0.22.0, the `all` function is deprecated and will be removed in a future release. It is recommended that you use the `Promise.all` method instead.

### `spread`

The `spread` function is a utility function that can be used to spread an array of arguments into a function call. This is useful when you have an array of arguments that you want to pass to a function that takes multiple arguments.

```ts
spread<T, R>(callback: (...args: T[]) => R): (array: T[]) => R;
```

### `toFormData`

A function that converts an object to a `FormData` object. This function is useful when you want to send form data in an HTTP request.

### `formToJSON`

A function that converts a `FormData` object to a JSON object. This function is useful when you want to convert form data to a JSON object.

### `getAdapter`

A function that returns the current adapter that is being used by the `axios` instance.

### `mergeConfig`

A function that merges two configuration objects. This function is used internally by the `axios` instance to merge the default configuration with the user-provided configuration.

## Constants

### `HttpStatusCode`

An object that contains a list of HTTP status codes and their corresponding status messages. This object is used to map status codes to status messages in the `AxiosError` class.

## Miscellaneous

### `VERSION`

The current version of the `axios` package. This is a string that represents the version number of the package. It is updated with each release of the package.
