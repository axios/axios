# Header methods <Badge type="tip" text="New" />

With the introduction of the new `AxiosHeaders` class, Axios provides a set of methods to manipulate headers. These methods are used to set, get, and delete headers in a more convenient way than directly manipulating the headers object.

## Constructor `new AxiosHeaders(headers?)`

The `AxiosHeaders` class constructor accepts an optional object with headers to initialize the instance. The headers object can contain any number of headers, and the keys are case-insensitive.

```js
constructor(headers?: RawAxiosHeaders | AxiosHeaders | string);
```

For convenience, you can pass a string with headers separated by a newline character. The headers are then parsed and added to the instance.

```js
const headers = new AxiosHeaders(`
Host: www.bing.com
User-Agent: curl/7.54.0
Accept: */*`);

console.log(headers);

// Object [AxiosHeaders] {
//   host: 'www.bing.com',
//   'user-agent': 'curl/7.54.0',
//   accept: '*/*'
// }
```

## Set

The `set` method is used to set headers on the instance of `AxiosHeaders`. The method can be called with a single header name and value, an object with multiple headers, or a string with headers separated by a newline character. The method also accepts an optional `rewrite` parameter that controls the behaviour of setting the header.

```js
set(headerName, value: Axios, rewrite?: boolean);
set(headerName, value, rewrite?: (this: AxiosHeaders, value: string, name: string, headers: RawAxiosHeaders) => boolean);
set(headers?: RawAxiosHeaders | AxiosHeaders | string, rewrite?: boolean);
```

The rewrite argument controls the overwriting behaviour:

- `false` - do not overwrite if header's value is set (is not undefined)
- `undefined` (default) - overwrite the header unless its value is set to false
- `true` - rewrite anyway

The option can also accept a user-defined function that determines whether the value should be overwritten or not. The function receives the current value, header name, and the headers object as arguments.

## Get

The `get` method is used to retrieve the value of a header. The method can be called with a single header name, an optional matcher, or a parser. The matcher is defaulted to `true`. The parser can be a regular expression that is used to extract the value from the header.

```js
get(headerName: string, matcher?: true | AxiosHeaderMatcher): AxiosHeaderValue;
get(headerName: string, parser: RegExp): RegExpExecArray | null;
```

An example of some of the possible usages of the `get` method is shown below:

```js
const headers = new AxiosHeaders({
  "Content-Type": "multipart/form-data; boundary=Asrf456BGe4h",
});

console.log(headers.get("Content-Type"));
// multipart/form-data; boundary=Asrf456BGe4h

console.log(headers.get("Content-Type", true)); // parse key-value pairs from a string separated with \s,;= delimiters:
// [Object: null prototype] {
//   'multipart/form-data': undefined,
//    boundary: 'Asrf456BGe4h'
// }

console.log(
  headers.get("Content-Type", (value, name, headers) => {
    return String(value).replace(/a/g, "ZZZ");
  })
);
// multipZZZrt/form-dZZZtZZZ; boundZZZry=Asrf456BGe4h

console.log(headers.get("Content-Type", /boundary=(\w+)/)?.[0]);
// boundary=Asrf456BGe4h
```

## Has

The `has` method is used to check if a header exists in the instance of `AxiosHeaders`. The method can be called with a single header name and an optional matcher.

```js
has(header: string, matcher?: AxiosHeaderMatcher): boolean;
```

::: info
Returns true if the header is set (has no undefined value).
:::

## Delete

The `delete` method is used to delete a header from the instance of `AxiosHeaders`. The method can be called with a single header name and an optional matcher.

```js
delete(header: string | string[], matcher?: AxiosHeaderMatcher): boolean;
```

::: info
Returns true if at least one header has been removed.
:::

## Clear

The `clear` method is used to delete all headers from the instance of `AxiosHeaders` if nothing is passed. If a matcher is passed, only the headers that match the matcher are removed, in this case, the matcher is used to match against the header name rather than the value.

```js
clear(matcher?: AxiosHeaderMatcher): boolean;
```

::: info
Returns true if at least one header has been cleared.
:::

## Normalize

If the headers object was changed directly, it can cause duplicates with the same name but in different cases. This method normalizes the headers object by combining duplicate keys into one. Axios uses this method internally after calling each interceptor. Set format to true for converting headers name to lowercase and capitalize the initial letters (cOntEnt-type => Content-Type) or false to keep the original format.

```js
const headers = new AxiosHeaders({
  foo: "1",
});

headers.Foo = "2";
headers.FOO = "3";

console.log(headers.toJSON()); // [Object: null prototype] { foo: '1', Foo: '2', FOO: '3' }
console.log(headers.normalize().toJSON()); // [Object: null prototype] { foo: '3' }
console.log(headers.normalize(true).toJSON()); // [Object: null prototype] { Foo: '3' }
```

::: info
Returns `this` for chaining.
:::

## Concat

Merges the instance with targets into a new AxiosHeaders instance. If the target is a string, it will be parsed as RAW HTTP headers. If the target is an AxiosHeaders instance, it will be merged with the current instance.

```js
concat(...targets: Array<AxiosHeaders | RawAxiosHeaders | string | undefined | null>): AxiosHeaders;
```

::: info
Returns a new AxiosHeaders instance.
:::

## toJSON

Resolve all internal headers values into a new null prototype object. Set `asStrings` to true to resolve arrays as a string containing all elements, separated by commas.

```js
toJSON(asStrings?: boolean): RawAxiosHeaders;
```

## From

Returns a new `AxiosHeaders` instance created from the raw headers passed in, or simply returns the given headers object if it's an `AxiosHeaders` instance.

```js
from(thing?: AxiosHeaders | RawAxiosHeaders | string): AxiosHeaders;
```

## Shortcuts

The following shortcuts are available:

- `setContentType`, `getContentType`, `hasContentType`
- `setContentLength`, `getContentLength`, `hasContentLength`
- `setAccept`, `getAccept`, `hasAccept`
- `setUserAgent`, `getUserAgent`, `hasUserAgent`
- `setContentEncoding`, `getContentEncoding`, `hasContentEncoding`
