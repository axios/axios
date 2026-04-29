# En-têtes <Badge type="tip" text="Nouveau" />

Axios expose sa propre classe AxiosHeaders pour manipuler les en-têtes en utilisant une API de type Map qui garantit des clés insensibles à la casse. Cette classe est utilisée en interne par Axios pour gérer les en-têtes, mais elle est également exposée à l'utilisateur pour plus de commodité. Bien que les en-têtes HTTP soient insensibles à la casse, Axios conservera la casse de l'en-tête original pour des raisons stylistiques et comme solution de contournement lorsque des serveurs tiennent incorrectement compte de la casse des en-têtes. L'ancienne méthode de manipulation directe de l'objet d'en-têtes est toujours disponible, mais dépréciée et non recommandée pour un usage futur.

## Travailler avec les en-têtes

L'instance d'objet AxiosHeaders peut contenir différents types de valeurs internes qui contrôlent la logique de définition et de fusion. L'objet d'en-têtes final est obtenu par Axios en appelant la méthode toJSON. L'objet AxiosHeaders est également itérable, vous pouvez donc l'utiliser dans des boucles ou le convertir en tableau ou en objet.

Les valeurs d'en-tête peuvent être de l'un des types suivants :

- `string` - valeur de chaîne normale qui sera envoyée au serveur
- `null` - ignorer l'en-tête lors de la conversion en JSON
- `false` - ignorer l'en-tête lors de la conversion en JSON, indique également que la méthode set doit être appelée avec l'option rewrite définie à true pour écraser cette valeur (Axios l'utilise en interne pour permettre aux utilisateurs de refuser l'installation de certains en-têtes comme User-Agent ou Content-Type)
- `undefined` - la valeur n'est pas définie

::: warning
La valeur de l'en-tête est considérée comme définie si elle n'est pas undefined.
:::

L'objet d'en-têtes est toujours initialisé à l'intérieur des intercepteurs et des transformateurs, comme illustré dans l'exemple suivant :

```js
axios.interceptors.request.use((request: InternalAxiosRequestConfig) => {
  request.headers.set("My-header", "value");

  request.headers.set({
    "My-set-header1": "my-set-value1",
    "My-set-header2": "my-set-value2",
  });

  // Désactiver la définition ultérieure de cet en-tête par Axios
  request.headers.set("User-Agent", false);

  request.headers.setContentType("text/plain");

  // L'accès direct comme celui-ci est déprécié
  request.headers["My-set-header2"] = "newValue";

  return request;
});
```

Vous pouvez itérer sur un AxiosHeaders en utilisant n'importe quelle méthode itérable, comme une boucle for-of, forEach, ou l'opérateur spread :

```js
const headers = new AxiosHeaders({
  foo: '1',
  bar: '2',
  baz: '3',
});

for (const [header, value] of headers) {
  console.log(header, value);
}

// foo 1
// bar 2
// baz 3
```

## Définir des en-têtes sur une requête

L'endroit le plus courant pour définir des en-têtes est l'option `headers` dans votre configuration de requête ou de configuration d'instance :

```js
// Sur une seule requête
await axios.get('/api/data', {
  headers: {
    'Accept-Language': 'en-US',
    'X-Request-ID': 'abc123',
  },
});

// Sur une instance (appliqué à chaque requête)
const api = axios.create({
  headers: {
    'X-App-Version': '2.0.0',
  },
});
```

## Préserver la casse d'un en-tête spécifique

Les noms d'en-têtes Axios sont insensibles à la casse, mais `AxiosHeaders` conserve la casse de la première clé correspondante qu'il voit. Si vous avez besoin d'une casse spécifique pour un serveur avec un comportement non standard sensible à la casse, définissez un préréglage de casse dans les valeurs par défaut puis définissez les valeurs normalement.

```js
const api = axios.create();

api.defaults.headers.common = {
  'content-type': undefined,
  accept: undefined,
};

await api.put(url, data, {
  headers: {
    'Content-Type': 'application/octet-stream',
    Accept: 'application/json',
  },
});
```

Vous pouvez également le faire avec `AxiosHeaders` directement lors de la composition d'en-têtes :

```js
import axios, { AxiosHeaders } from 'axios';

const headers = AxiosHeaders.concat(
  { 'content-type': undefined },
  { 'Content-Type': 'application/octet-stream' }
);

await axios.put(url, data, { headers });
```

## Définir des en-têtes dans un intercepteur

Les intercepteurs sont l'endroit approprié pour attacher des en-têtes dynamiques comme les tokens d'authentification, car le token peut ne pas être disponible au moment où l'instance est créée :

```js
api.interceptors.request.use((config) => {
  const token = getAuthToken(); // lire au moment de la requête
  config.headers.set('Authorization', `Bearer ${token}`);
  return config;
});
```

## Lire les en-têtes de réponse

Les en-têtes de réponse sont disponibles sur `response.headers` en tant qu'instance d'`AxiosHeaders`. Tous les noms d'en-têtes sont en minuscules :

```js
const response = await axios.get('/api/data');

console.log(response.headers['content-type']);
// application/json; charset=utf-8

console.log(response.headers.get('x-request-id'));
// abc123
```

## Supprimer un en-tête par défaut

Pour refuser un en-tête qu'axios définit par défaut (comme `Content-Type` ou `User-Agent`), définissez sa valeur à `false` :

```js
await axios.post('/api/data', payload, {
  headers: {
    'Content-Type': false, // laisser le navigateur le définir automatiquement (ex. pour FormData)
  },
});
```

Pour plus de détails sur l'API complète des méthodes `AxiosHeaders`, consultez la page [Méthodes d'en-têtes](/pages/advanced/header-methods).
