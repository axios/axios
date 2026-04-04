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

In v1.x you would need to leverage the type `InternalAxiosRequestConfig` to type the `config` parameter in the `request` interceptor. This is because the `config` parameter is now typed as `AxiosRequestConfig` which is a public type.

### Changes to request headers shape

In v1.x, the shape of the request headers has been changed to drop the `common` property. This means that you will need to update your code to use the new shape of the request headers as follows:

```diff
- if (request.headers?.common?.Authorization) {
-       request.headers.common.Authorization = ...
+ if (request.headers?.Authorization) {
+       request.headers.Authorization = ...
```

### Multipart form data

If a request includes a formData payload, the `Content-Type` header of `multipart/form-data` will be automatically included. This means that you will need to update your code to remove the `Content-Type` header from the request headers.

If you set the `Content-Type` header to `application/json` we will automatically serialize the data to JSON.

### Parameter serialization

Please review the latest documentation on how to serialize parameters in the latest version of axios. The changes here are too numerous to list in this guide, and they are breaking changes.

### Internals exported

We have elected to no longer export the internals of axios. This means that you will need to update your code to only use the public API of axios. This change was made to simplify the API and reduce the surface area of axios. Allowing us to make changes to the internals without need to declare them as breaking changes.

Please review the API reference on this site for the latest information on the public API of axios.

### Request config

We have made changes to the request config object. Please review the config reference on this site for the latest information on the request config object.

### Missed breaking changes

This guide is not exhaustive and may not cover all breaking changes, should you encounter any issue please open an issue on the [docs GitHub repository](https://github.com/axios/docs) with the label `breaking change`.
