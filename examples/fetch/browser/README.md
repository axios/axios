
## axios + fetch: browser examples

This directory contains examples of using Axios with the Fetch Adapter in browser environments. There are two samples:
`browser` and `minimal`, with `minimal` having two variables (regular and `esm`).

In browser environments that support ESM, the `esm` bundle can be used as a JavaScript module. In regular JavaScript
environments without ESM support (i.e. [older browsers][^1]), the regular non-ESM bundle can be used.

For further reading about Fetch in the browser, see the _Further reading_ section of the [fetch examples README](../).

### Full example

> **Full sample code:** [./browser.html](./browser.html)

The full sample has the broadest compatibility and best performance, via the `nomodule` attribute:
```html
<script type="module">
  import axios from "https://axios.elide.dev/axios/1.2.1-fetch/beta2/esm/axios.min.js";
  // use axios as ESM module...
</script>
<script nomodule src="https://axios.elide.dev/axios/1.2.1-fetch/beta2/axios.min.js"></script>
<script nomodule>
  // use axios as regular JS...
</script>
```

### Minimal example

> **Minimal sample (ESM) full code:** [./minimal.esm.html](./minimal.esm.html)

For targets that are shipping only to ESM-supporting browsers:

```html
<script type="module">
    import axios from "https://axios.elide.dev/axios/1.2.1-fetch/beta2/esm/axios.min.js";
    // use axios as ESM module...
</script>
```

> **Minimal sample (non-ESM) full code:** [./minimal.html](./minimal.html)

For targets that are shipping to only non-ESM-supporting browsers:

```html
<script src="https://axios.elide.dev/axios/1.2.1-fetch/beta2/axios.min.js"></script>
<script>
    axios.get("https://httpbin.org/json", {adapter: 'fetch'}).then(function (response) {
        console.log("data from response: ", JSON.stringify(response.data));
    });
</script>
```
