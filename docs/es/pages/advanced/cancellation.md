# Cancelación

A partir de la versión v0.22.0, Axios es compatible con AbortController para cancelar solicitudes de forma limpia. Esta característica está disponible en el navegador y en Node.js cuando se usa una versión de Axios que admite AbortController. Para cancelar una solicitud, debes crear una instancia de `AbortController` y pasar su `signal` a la opción `signal` de la solicitud.

```js
const controller = new AbortController();

axios
  .get("/foo/bar", {
    signal: controller.signal,
  })
  .then(function (response) {
    //...
  });
// cancel the request
controller.abort();
```

## CancelToken <Badge type="danger" text="Obsoleto" />

También puedes usar la API `CancelToken` para cancelar solicitudes. Esta API está obsoleta y será eliminada en la próxima versión mayor. Se recomienda usar `AbortController` en su lugar. Puedes crear un token de cancelación usando la fábrica `CancelToken.source` como se muestra a continuación:

```js
const CancelToken = axios.CancelToken;
const source = CancelToken.source();

axios
  .get("/user/12345", {
    cancelToken: source.token,
  })
  .catch(function (thrown) {
    if (axios.isCancel(thrown)) {
      console.log("Request canceled", thrown.message);
    } else {
      // handle error
    }
  });

axios.post(
  "/user/12345",
  {
    name: "new name",
  },
  {
    cancelToken: source.token,
  }
);

// cancel the request (the message parameter is optional)
source.cancel("Operation canceled by the user.");
```

También puedes crear un token de cancelación pasando una función ejecutora al constructor de `CancelToken`:

```js
const CancelToken = axios.CancelToken;
let cancel;

axios.get("/user/12345", {
  cancelToken: new CancelToken(function executor(c) {
    // An executor function receives a cancel function as a parameter
    cancel = c;
  }),
});

// cancel the request
cancel();
```

Puedes cancelar varias solicitudes con el mismo token de cancelación o controlador de cancelación. Si un token de cancelación ya fue cancelado en el momento en que se inicia una solicitud de Axios, la solicitud se cancela inmediatamente, sin intentar realizar ninguna solicitud real.
