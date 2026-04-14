# Formato x-www-form-urlencoded

## URLSearchParams

De forma predeterminada, axios serializa los objetos JavaScript a `JSON`. Para enviar datos en el formato [`application/x-www-form-urlencoded`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/POST) en su lugar, puedes usar la API [`URLSearchParams`](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams), que es [compatible](http://www.caniuse.com/#feat=urlsearchparams) con la gran mayoría de los navegadores, y con [Node.js](https://nodejs.org/api/url.html#url_class_urlsearchparams) a partir de la versión v10 (lanzada en 2018).

```js
const params = new URLSearchParams({ foo: 'bar' });
params.append('extraparam', 'value');
axios.post('/foo', params);
```

## Cadena de consulta <Badge type="danger" text="Muy antiguo" />

Para navegadores más antiguos o entornos sin `URLSearchParams`, puedes usar la librería [`qs`](https://github.com/ljharb/qs) para serializar objetos al formato `application/x-www-form-urlencoded`.

```js
const qs = require('qs');
axios.post('/foo', qs.stringify({ bar: 123 }));
```

En versiones muy antiguas de Node.js, puedes usar el módulo integrado `querystring` que viene con Node.js. Ten en cuenta que este módulo fue marcado como obsoleto en Node.js v16 — prefiere `URLSearchParams` o `qs` para código nuevo.

```js
const querystring = require('querystring');
axios.post('https://something.com/', querystring.stringify({ foo: 'bar' }));
```

## Serialización automática a URLSearchParams <Badge type="tip" text="Nuevo" />

A partir de la versión v0.21.0, axios serializa automáticamente los objetos JavaScript a `URLSearchParams` si el encabezado `Content-Type` está establecido en `application/x-www-form-urlencoded`. Esto significa que puedes pasar un objeto JavaScript directamente a la propiedad `data` de la configuración de solicitud de axios. Por ejemplo, al pasar datos a una solicitud `POST`:

```js
const data = {
  x: 1,
  arr: [1, 2, 3],
  arr2: [1, [2], 3],
  users: [
    { name: 'Peter', surname: 'Griffin' },
    { name: 'Thomas', surname: 'Anderson' },
  ],
};

await axios.postForm('https://postman-echo.com/post', data, {
  headers: { 'content-type': 'application/x-www-form-urlencoded' },
});
```

El objeto `data` será serializado automáticamente a `URLSearchParams` y enviado en el formato `application/x-www-form-urlencoded`. El servidor recibirá los siguientes datos:

```json
{
  "x": "1",
  "arr[]": ["1", "2", "3"],
  "arr2[0]": "1",
  "arr2[1][0]": "2",
  "arr2[2]": "3",
  "users[0][name]": "Peter",
  "users[0][surname]": "Griffin",
  "users[1][name]": "Thomas",
  "users[1][surname]": "Anderson"
}
```

Si el analizador de cuerpo de tu backend (como `body-parser` de `express.js`) admite la decodificación de objetos anidados, recibirás el mismo objeto en el lado del servidor automáticamente.

```js
var app = express();

app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.post('/', function (req, res, next) {
  // echo body as JSON
  res.send(JSON.stringify(req.body));
});

server = app.listen(3000);
```
