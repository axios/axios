# Upgrade guide

This guide is intended to help you upgrade your project from one version of the framework to another. It is recommended to read the release notes for each major version you are upgrading from/to, as they may contain important information about breaking changes.

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
