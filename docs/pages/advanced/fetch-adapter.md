# Fetch adapter <Badge type="tip" text="New" />

The `fetch` adapter is a new adapter that we have introduced as of version 1.7.0. This provides a way to use axios with the `fetch` API thus giving you the best of both worlds. By default, `fetch` will be used if `xhr` and `http` adapters are not available in the build, or not supported by the environment. To use it by default, it must be selected explicitly by setting the `adapter` option to `fetch` when creating an instance of axios.

```js
import axios from 'axios';

const instance = axios.create({
  adapter: 'fetch',
});
```

The adapter supports the same functionality as the `xhr` adapter, including upload and download progress capturing. It also supports additional response types such as `stream` and `formdata` (if supported by the environment).

## Custom fetch <Badge type="tip" text="v1.12.0+" />

Starting from `v1.12.0`, you can customise the fetch adapter to use a custom `fetch` function instead of the environment global. You can pass a custom `fetch` function, `Request`, and `Response` constructors via the `env` config option. This is useful when working with custom environments or app frameworks that provide their own `fetch` implementation.

::: info
When using a custom `fetch` function, you may also need to supply matching `Request` and `Response` constructors. If you omit them, the global constructors will be used. If your custom `fetch` is incompatible with the globals, pass `null` to disable them.

**Note:** Setting `Request` and `Response` to `null` will make it impossible for the fetch adapter to capture upload and download progress.
:::

### Basic example

```js
import customFetchFunction from 'customFetchModule';

const instance = axios.create({
  adapter: 'fetch',
  onDownloadProgress(e) {
    console.log('downloadProgress', e);
  },
  env: {
    fetch: customFetchFunction,
    Request: null, // null -> disable the constructor
    Response: null,
  },
});
```

### Using with Tauri

[Tauri](https://tauri.app/plugin/http-client/) provides a platform `fetch` function that bypasses browser CORS restrictions for requests made from the native layer. The example below shows a minimal setup for using axios inside a Tauri app with that custom fetch.

```js
import { fetch } from '@tauri-apps/plugin-http';
import axios from 'axios';

const instance = axios.create({
  adapter: 'fetch',
  onDownloadProgress(e) {
    console.log('downloadProgress', e);
  },
  env: {
    fetch,
  },
});

const { data } = await instance.get('https://google.com');
```

### Using with SvelteKit

[SvelteKit](https://svelte.dev/docs/kit/web-standards#Fetch-APIs) provides a custom `fetch` implementation for server-side `load` functions that handles cookie forwarding and relative URLs. Because its `fetch` is incompatible with the standard `URL` API, axios must be configured to use it explicitly, and the global `Request` and `Response` constructors must be disabled.

```js
export async function load({ fetch }) {
  const { data: post } = await axios.get('https://jsonplaceholder.typicode.com/posts/1', {
    adapter: 'fetch',
    env: {
      fetch,
      Request: null,
      Response: null,
    },
  });

  return { post };
}
```
