# Fetch adapter <Badge type="tip" text="New" />

The `fetch` adapter is a new adapter that we have introduced as of version 1.7.0. This provides a way to use axios with the `fetch` API thus giving you the best of both worlds. By default, `fetch` will be used if `xhr` and `http` adapters are not available in the build, or not supported by the environment. To use it by default, it must be selected explicitly by setting the `adapter` option to `fetch` when creating an instance of axios.

```js
import axios from "axios";

const instance = axios.create({
  adapter: "fetch",
});
```

The adapter supports the same functionality as the `xhr` adapter, including upload and download progress capturing. It also supports additional response types such as `stream` and `formdata` (if supported by the environment).
