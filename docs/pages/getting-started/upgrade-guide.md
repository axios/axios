# Upgrade guide

This guide is intended to help you upgrade your project from one version of the framework to another. It is recommended to read the release notes for each major version you are upgrading from/to, as they may contain important information about breaking changes.

## Upgrading to v1.21.0

### Custom class instances as header defaults

Under `headers.common` and method keys such as `headers.post`, axios now treats only plain objects, null-prototype objects, and `AxiosHeaders` instances as defaults buckets, so literal headers named after a method, such as `Link`, are preserved. If you assign an instance of your own class as a bucket, convert it to a plain object (`{ post: { ...customDefaults } }`) or to `new AxiosHeaders({ ...customDefaults })`. Otherwise its string representation is sent as a literal header on every request, including requests with other methods, which can expose contents included by a custom `toString()`. See [Method-specific header defaults](/pages/advanced/config-defaults#method-specific-header-defaults).

## Upgrading to v1.20.0

### Custom fetch receives a filtered second argument

When a `Request` constructor is available, a custom `env.fetch` still receives `fetchOptions` as its second argument, but without `method`, `headers`, `body`, `signal`, `duplex`, and `credentials`. These values are represented by the resolved `Request` passed as the first argument, and omitting them prevents the second argument from overriding it. Custom fetch implementations that read those fields from the second argument must read them from the `Request` instead. See [Arguments passed to a custom fetch](/pages/advanced/fetch-adapter#arguments-passed-to-a-custom-fetch).

### Fetch adapter and `maxRedirects: 0`

The fetch adapter maps `maxRedirects: 0` to the platform's manual redirect mode instead of following redirects. In Node.js the `3xx` response and its `Location` header may be visible; browsers return an opaque redirect with status `0` and unreadable headers. Positive values still do not limit the redirect count in the fetch adapter. See [Fetch adapter redirects](/pages/advanced/fetch-adapter#redirects).

### HTTP/2 and proxies

Requests with `httpVersion: 2` and an explicit `proxy` object reject with `ERR_NOT_SUPPORT`. HTTP/2 requests ignore proxy environment variables and agent `proxyEnv` settings and connect directly, so do not use HTTP/2 where proxying is a mandatory egress policy. `proxy: false` continues to connect directly. See [HTTP2 proxies](/pages/advanced/http2#proxies).

### Replacement configs from request interceptors

When a request interceptor returns a different object than the config it received, axios copies it into a filtered null-prototype snapshot before dispatch. Fields inherited from an application-defined prototype are copied as own fields, but the snapshot does not preserve the object's identity, prototype, `instanceof` checks, accessors, or property attributes. Fields inherited through a prototype whose own prototype is `null`, such as an `Object.create(null)` template, are ignored. Returning the original config keeps its identity. See [Returning a different config object](/pages/advanced/interceptors#returning-a-different-config-object).

### RFC 9110 status code names

`HttpStatusCode.ContentTooLarge` (413) and `HttpStatusCode.UnprocessableContent` (422) are the preferred names. `PayloadTooLarge` and `UnprocessableEntity` remain available as deprecated aliases throughout v1.x, and numeric reverse lookups still return the legacy names.

## Upgrading to v1.19.0

### Malformed HTTP(S) URLs are rejected

Requests now reject an `http:` or `https:` `url` or `baseURL` that omits `//` after the protocol. Replace values such as `https:example.com` or `https:/example.com` with a well-formed URL such as `https://example.com`. The resulting `AxiosError` uses code `ERR_INVALID_URL` and identifies the safely redacted offending URL. This intentional security change prevents malformed-URL normalization from bypassing `baseURL` or URL allowlists.

### Synchronous request interceptor errors

When a synchronous request interceptor throws, axios invokes its paired rejection handler and stops the remaining request interceptors. A rejection handler that returns normally handles the error and dispatches with the last valid config; its return value does not become the request config. If validation must block dispatch, omit the rejection handler or throw/return a rejected Promise from it. Terminal errors continue through response rejection interceptors.

## Upgrading from v0.x to v1.x

### Changes to the import statement

In v1.x, the import statement has been changed to use the `default` export. This means that you will need to update your import statements to use the `default` export.

```diff
- import { axios } from "axios";
+ import axios from "axios";
```

### Changes to the interceptor system

In v1.x you need to leverage the type `InternalAxiosRequestConfig` to type the `config` parameter in the `request` interceptor. This is because the `config` parameter is now typed as `InternalAxiosRequestConfig` instead of the public `AxiosRequestConfig` type.

```diff
- axios.interceptors.request.use((config: AxiosRequestConfig) => {
+ axios.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    return config;
  });
```

### Changes to request headers shape

In v1.x, the shape of the request headers has been changed to drop the `common` property. This means that you will need to update your code to use the new shape of the request headers as follows:

```diff
- if (request.headers?.common?.Authorization) {
-       request.headers.common.Authorization = ...
+ if (request.headers?.Authorization) {
+       request.headers.Authorization = ...
```

Default headers that were previously under `common`, `get`, `post`, etc. are now set directly on `axios.defaults.headers`:

```diff
- axios.defaults.headers.common["Accept"] = "application/json";
+ axios.defaults.headers["Accept"] = "application/json";
```

### Multipart form data

If a request includes a `FormData` payload, the `Content-Type: multipart/form-data` header is now set automatically. Remove any manual header to avoid duplicates:

```diff
- axios.post("/upload", formData, {
-   headers: { "Content-Type": "multipart/form-data" },
- });
+ axios.post("/upload", formData);
```

If you explicitly set `Content-Type: application/json`, axios will now automatically serialize the data to JSON.

### Parameter serialization

v1.x introduced several breaking changes to how URL parameters are serialized. The most important ones:

**`params` are now percent-encoded by default.** If your backend expected raw brackets from qs-style encoding, you may need to configure a custom serializer:

```js
import qs from 'qs';

axios.create({
  paramsSerializer: {
    serialize: (params) => qs.stringify(params, { arrayFormat: 'brackets' }),
  },
});
```

**Nested objects in `params` are now serialized with bracket notation** (`foo[bar]=1`) rather than dot notation. If your backend expected dot notation, use a custom serializer.

**`null` and `undefined` params** are now handled consistently: `null` values are serialized as empty strings, while `undefined` values are omitted entirely.

For the full parameter serialization config options, see the [Request config](/pages/advanced/request-config) page.

### Internals no longer exported

We have elected to no longer export the internals of axios. This means that you will need to update your code to only use the public API of axios. This change was made to simplify the API and reduce the surface area of axios, allowing us to make changes to the internals without declaring them as breaking changes.

Please review the [API reference](/pages/advanced/api-reference) on this site for the latest information on the public API of axios.

### Request config

We have made changes to the request config object. Please review the [config reference](/pages/advanced/request-config) on this site for the latest information.

### Missed breaking changes

This guide is not exhaustive and may not cover all breaking changes. Should you encounter any issue, please open an issue on the [docs GitHub repository](https://github.com/axios/docs) with the label `breaking change`.
