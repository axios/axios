# Format x-www-form-urlencoded

## URLSearchParams

Par défaut, axios sérialise les objets JavaScript en `JSON`. Pour envoyer des données au format [`application/x-www-form-urlencoded`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/POST) à la place, vous pouvez utiliser l'API [`URLSearchParams`](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams), [supportée](http://www.caniuse.com/#feat=urlsearchparams) par la grande majorité des navigateurs, et [Node.js](https://nodejs.org/api/url.html#url_class_urlsearchparams) depuis la version v10 (publiée en 2018).

```js
const params = new URLSearchParams({ foo: 'bar' });
params.append('extraparam', 'value');
axios.post('/foo', params);
```

## Chaîne de requête <Badge type="danger" text="Très ancien" />

Pour les navigateurs plus anciens ou les environnements sans `URLSearchParams`, vous pouvez utiliser la bibliothèque [`qs`](https://github.com/ljharb/qs) pour sérialiser des objets au format `application/x-www-form-urlencoded`.

```js
const qs = require('qs');
axios.post('/foo', qs.stringify({ bar: 123 }));
```

Dans les très anciennes versions de Node.js, vous pouvez utiliser le module natif `querystring` fourni avec Node.js. Notez que ce module a été déprécié dans Node.js v16 — préférez `URLSearchParams` ou `qs` pour le nouveau code.

```js
const querystring = require('querystring');
axios.post('https://something.com/', querystring.stringify({ foo: 'bar' }));
```

## Sérialisation automatique vers URLSearchParams <Badge type="tip" text="Nouveau" />

À partir de la version v0.21.0, axios sérialise automatiquement les objets JavaScript en `URLSearchParams` si l'en-tête `Content-Type` est défini à `application/x-www-form-urlencoded`. Cela signifie que vous pouvez passer directement un objet JavaScript à la propriété `data` de la configuration de requête axios. Par exemple lors de l'envoi de données vers une requête `POST` :

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

L'objet `data` sera automatiquement sérialisé en `URLSearchParams` et envoyé au format `application/x-www-form-urlencoded`. Le serveur recevra les données suivantes :

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

Si le body-parser de votre backend (comme `body-parser` d'`express.js`) prend en charge le décodage des objets imbriqués, vous obtiendrez automatiquement le même objet côté serveur.

```js
var app = express();

app.use(bodyParser.urlencoded({ extended: true })); // support des corps encodés

app.post('/', function (req, res, next) {
  // écho du corps en JSON
  res.send(JSON.stringify(req.body));
});

server = app.listen(3000);
```
