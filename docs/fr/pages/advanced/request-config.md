# Configuration de requête

La configuration de requête est utilisée pour paramétrer la requête. Un large éventail d'options est disponible, mais la seule option obligatoire est `url`. Si l'objet de configuration ne contient pas de champ `method`, la méthode par défaut est `GET`.

::: warning Sécurité : la protection contre les bombes de décompression est optionnelle
Par défaut, `maxContentLength` et `maxBodyLength` valent `-1` (illimité). Un serveur malveillant ou compromis peut renvoyer un petit corps compressé en gzip/deflate/brotli/zstd qui s'étend à plusieurs gigaoctets et épuise le processus Node.js.

Si vous appelez des serveurs auxquels vous ne faites pas pleinement confiance, **définissez un plafond** :

```js
axios.defaults.maxContentLength = 10 * 1024 * 1024; // 10 Mo
axios.defaults.maxBodyLength = 10 * 1024 * 1024;
```

Consultez le [guide de sécurité](/pages/misc/security) pour plus de détails.
:::

### `url`

L'`url` est l'URL vers laquelle la requête est envoyée. Il peut s'agir d'une chaîne de caractères ou d'une instance de `URL`.

### `method`

La `method` est la méthode HTTP à utiliser pour la requête. La méthode par défaut est `GET`.

### `baseURL`

La `baseURL` est l'URL de base à ajouter en préfixe à l'`url`, sauf si celle-ci est une URL absolue. Utile pour effectuer des requêtes vers le même domaine sans avoir à répéter le nom de domaine et tout préfixe d'API ou de version.

### `allowAbsoluteUrls`

`allowAbsoluteUrls` détermine si les URLs absolues peuvent remplacer une `baseUrl` configurée. Lorsqu'elle est définie à `true` (valeur par défaut), les valeurs absolues de `url` remplacent `baseUrl`. Lorsqu'elle est définie à `false`, les valeurs absolues de `url` sont toujours précédées de `baseUrl`.

### `transformRequest`

La fonction `transformRequest` vous permet de modifier les données de la requête avant leur envoi au serveur. Cette fonction est appelée avec les données de la requête comme seul argument. Elle ne s'applique que pour les méthodes de requête `PUT`, `POST`, `PATCH` et `DELETE`. La dernière fonction du tableau doit retourner une chaîne ou une instance de Buffer, ArrayBuffer, FormData ou Stream.

### `transformResponse`

La fonction `transformResponse` vous permet de modifier les données de la réponse avant qu'elles ne soient transmises aux fonctions `then` ou `catch`. Cette fonction est appelée avec les données de la réponse comme seul argument.

### `parseReviver`

La fonction `parseReviver` vous permet de fournir une fonction « reviver » personnalisée directement à l'appel natif `JSON.parse()` utilisé par le `transformResponse` par défaut.

C'est particulièrement utile pour effectuer une hydratation de types haute performance (par exemple, convertir des chaînes ISO en objets `Temporal` ou `Date`) ou pour éviter une perte de précision lors de l'analyse.

Dans les environnements modernes (ES2023+), la fonction reviver reçoit un troisième argument `context`. Celui-ci donne accès au `source` JSON brut, permettant la conversion précise de grands entiers (BigInt) qui perdraient autrement en précision s'ils étaient analysés comme des nombres JavaScript standards.

> Remarque : `Temporal` n'est pas encore disponible dans tous les environnements. Envisagez l'utilisation d'un polyfill si nécessaire.

```js
const client = axios.create({
  parseReviver: (key, value, context) => {
    // Exemple : analyse BigInt sans perte de précision
    if (typeof value === 'number' && context?.source) {
      const isInteger = Number.isInteger(value);
      const isUnsafe = !Number.isSafeInteger(value);
      const isValidIntegerString = /^-?\d+$/.test(context.source);

      if (isInteger && isUnsafe && isValidIntegerString) {
        try {
          return BigInt(context.source);
        } catch {
          // Solution de repli : retourne la valeur d'origine si l'analyse échoue
        }
      }
    }

    // Exemple : hydratation des dates en objets Temporal
    if (
      typeof value === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      typeof Temporal !== 'undefined' &&
      Temporal?.PlainDate
    ) {
      return Temporal.PlainDate.from(value);
    }

    return value;
  },
});
```

### `headers`

Les `headers` sont les en-têtes HTTP à envoyer avec la requête. L'en-tête `Content-Type` est défini à `application/json` par défaut.

### `params`

Les `params` sont les paramètres d'URL à envoyer avec la requête. Il doit s'agir d'un objet simple ou d'un objet URLSearchParams. Si l'`url` contient des paramètres de requête, ils seront fusionnés avec l'objet `params`.

### `paramsSerializer`

La fonction `paramsSerializer` vous permet de sérialiser l'objet `params` avant son envoi au serveur. Plusieurs options sont disponibles pour cette fonction ; veuillez vous référer à l'exemple de configuration complète en bas de cette page.

#### Encodage pour-cent strict RFC 3986

Par défaut, axios redécode `%3A`, `%24`, `%2C` et `%20` vers `:`, `$`, `,` et `+` pour la lisibilité (le `+` suit la convention `application/x-www-form-urlencoded` pour représenter une espace dans une chaîne de requête). Ces caractères sont valides dans un composant de requête selon la [RFC 3986](https://datatracker.ietf.org/doc/html/rfc3986#section-3.4), donc la sortie par défaut est correcte. Cependant, certains backends exigent un encodage pour-cent strict et rejettent la forme lisible.

Utilisez l'option `encode` pour remplacer l'encodeur par défaut :

```js
// Par requête : émettre un encodage pour-cent strict RFC 3986 pour les valeurs de requête
axios.get('/foo', {
  params: { filter: JSON.stringify({ startedAt: '2026-01-23' }) },
  paramsSerializer: { encode: encodeURIComponent }
});

// Ou définir cela sur les valeurs par défaut de l'instance
const client = axios.create({
  paramsSerializer: { encode: encodeURIComponent }
});
```

### `data`

Les `data` sont les données à envoyer comme corps de la requête. Il peut s'agir d'une chaîne, d'un objet simple, d'un Buffer, d'un ArrayBuffer, d'un FormData, d'un Stream ou d'un URLSearchParams. Ne s'applique que pour les méthodes de requête `PUT`, `POST`, `DELETE` et `PATCH`. Sans `transformRequest`, doit être de l'un des types suivants :

- chaîne, objet simple, ArrayBuffer, ArrayBufferView, URLSearchParams
- Navigateur uniquement : FormData, File, Blob
- React Native : FormData
- Node uniquement : Stream, Buffer, FormData (package form-data)

Pour les objets `FormData` de navigateur, web worker et React Native, ne définissez pas manuellement `Content-Type` ; l'environnement ajoute lui-même la boundary multipart.

Pour les objets `FormData` Node.js qui fournissent une méthode `getHeaders()`, axios copie tous les en-têtes retournés par défaut pour assurer la compatibilité avec la v1. Si l'objet `FormData` est personnalisé ou n'est pas pleinement de confiance, définissez `formDataHeaderPolicy: 'content-only'` pour ne copier que `Content-Type` et `Content-Length`, et définissez explicitement tout autre en-tête de requête via la configuration `headers` de la requête.

### `formDataHeaderPolicy` <Badge type="warning" text="Node.js uniquement" />

Contrôle la manière dont axios copie les en-têtes retournés par `FormData#getHeaders()` de Node.js. La valeur par défaut est `'legacy'`, qui copie tous les en-têtes retournés afin de préserver le comportement existant de la v1. Définissez `'content-only'` pour ne copier que `Content-Type` et `Content-Length` depuis `getHeaders()`.

### `timeout`

Le `timeout` est le nombre de millisecondes avant l'expiration de la requête. Si la requête dure plus longtemps que `timeout`, elle sera annulée.

### `withCredentials`

La propriété `withCredentials` indique si les requêtes Cross-site Access-Control doivent être effectuées avec des informations d'identification telles que des cookies, des en-têtes d'autorisation ou des certificats client TLS. La définition de `withCredentials` n'a aucun effet sur les requêtes du même site.

### `adapter`

`adapter` permet une gestion personnalisée des requêtes, ce qui facilite les tests. Retournez une promise et fournissez une réponse valide ; consultez [les adaptateurs](/pages/advanced/adapters) pour plus d'informations. Nous fournissons également un certain nombre d'adaptateurs intégrés. L'adaptateur par défaut est `http` pour Node et `xhr` pour les navigateurs. La liste complète des adaptateurs intégrés est la suivante :

- fetch
- http
- xhr

Vous pouvez également passer un tableau d'adaptateurs ; axios utilisera le premier pris en charge par l'environnement.

### `auth`

`auth` indique que l'authentification HTTP Basic doit être utilisée, et fournit les identifiants. Cela définira un en-tête `Authorization`, en écrasant tout en-tête `Authorization` personnalisé que vous auriez défini via `headers`. Si `auth` est omis, les adaptateurs HTTP Node.js et fetch peuvent déduire les identifiants Basic depuis l'URL de requête, par exemple `https://user:pass@example.com` ; les identifiants encodés en pourcentage dans l'URL sont décodés, et `auth` prend toujours le dessus sur les identifiants intégrés à l'URL. Dans l'adaptateur HTTP Node.js, l'authentification Basic est conservée lors des redirections de même origine et supprimée lors des redirections cross-origin. Notez que seule l'authentification HTTP Basic est configurable via ce paramètre. Pour les tokens Bearer et similaires, utilisez plutôt des en-têtes `Authorization` personnalisés.

### `responseType`

Le `responseType` indique le type de données que le serveur retournera. Il peut s'agir de l'un des types suivants :

- arraybuffer
- document
- json
- text
- stream
- blob (navigateur uniquement)
- formdata (adaptateur fetch uniquement)

### `responseEncoding` <Badge type="warning" text="Node.js uniquement" />

Le `responseEncoding` indique l'encodage à utiliser pour décoder les réponses. Les options suivantes sont prises en charge :

- ascii
- ASCII
- ansi
- ANSI
- binary
- BINARY
- base64
- BASE64
- base64url
- BASE64URL
- hex
- HEX
- latin1
- LATIN1
- ucs-2
- UCS-2
- ucs2
- UCS2
- utf-8
- UTF-8
- utf8
- UTF8
- utf16le
- UTF16LE

::: tip
Remarque : ignoré pour un `responseType` de `stream` ou pour les requêtes côté client
:::

### `xsrfCookieName`

Le `xsrfCookieName` est le nom du cookie à utiliser comme valeur pour le token `XSRF`.

### `xsrfHeaderName`

Le `xsrfHeaderName` est le nom de l'en-tête à utiliser comme valeur pour le token `XSRF`.

### `withXSRFToken`

`withXSRFToken` contrôle si axios lit le cookie XSRF et définit l'en-tête XSRF sur les requêtes du navigateur. Accepte :

- `undefined` _(par défaut)_ — définit l'en-tête XSRF uniquement pour les requêtes du même site (same-origin).
- `true` — définit toujours l'en-tête XSRF, y compris pour les requêtes cross-origin.
- `false` — ne définit jamais l'en-tête XSRF.
- `(config: InternalAxiosRequestConfig) => boolean | undefined` — un callback qui décide par requête, en recevant l'objet de configuration interne.

```ts
withXSRFToken: boolean | undefined | ((config: InternalAxiosRequestConfig) => boolean | undefined);
```

::: warning XSRF cross-origin et `withCredentials`
`withCredentials` contrôle si les requêtes cross-site incluent des informations d'identification (cookies, authentification HTTP). Dans les anciennes versions d'axios, définir `withCredentials: true` provoquait implicitement l'envoi de l'en-tête XSRF pour les requêtes cross-origin. Les versions plus récentes d'axios séparent ces préoccupations : pour autoriser l'envoi de l'en-tête XSRF sur des requêtes cross-origin, vous devez définir **à la fois** `withCredentials: true` et `withXSRFToken: true`.

```js
axios.get('/user', { withCredentials: true, withXSRFToken: true });
```
:::

### `onUploadProgress`

La fonction `onUploadProgress` vous permet d'écouter la progression d'un envoi.

### `onDownloadProgress`

La fonction `onDownloadProgress` vous permet d'écouter la progression d'un téléchargement.

### `maxContentLength` <Badge type="warning" text="HTTP Node.js/fetch" />

La propriété `maxContentLength` définit la taille maximale de la réponse en octets. L'adaptateur HTTP Node.js l'applique aux réponses mises en mémoire tampon et aux réponses streamées. L'adaptateur fetch l'applique lorsque la longueur de la réponse est déclarée, lorsque le stream de réponse peut être suivi ou lorsque la taille de la réponse peut être déterminée.

> ⚠️ **Sécurité :** la valeur par défaut est `-1` (illimitée). Des réponses non bornées combinées à la décompression gzip/deflate/brotli/zstd rendent possible un déni de service par bombe de décompression.
> Définissez une limite explicite lorsque vous consommez des serveurs auxquels vous ne faites pas pleinement confiance.

### `maxBodyLength` <Badge type="warning" text="HTTP Node.js/fetch" />

La propriété `maxBodyLength` définit la taille maximale du corps de requête en octets. L'adaptateur HTTP Node.js l'applique, et l'adaptateur fetch l'applique lorsque la longueur du corps de requête peut être déterminée.

### `redact`

La propriété `redact` est un tableau optionnel de noms de clés de configuration à masquer lorsqu'une `AxiosError` est sérialisée avec `toJSON()`. La correspondance est insensible à la casse et récursive sur l'ensemble de la configuration de requête sérialisée. Les valeurs correspondantes sont remplacées par `[REDACTED ****]`.

`redact` n'affecte que la sérialisation des erreurs. Elle ne modifie ni les données de la requête, ni les en-têtes, ni l'objet de configuration original.

```js
axios.get('/user/12345', {
  headers: { Authorization: 'Bearer token' },
  auth: { username: 'me', password: 'secret' },
  redact: ['authorization', 'password']
}).catch((error) => {
  console.log(error.toJSON().config);
});
```

### `validateStatus`

La fonction `validateStatus` vous permet de remplacer la validation du code de statut par défaut. Par défaut, axios rejette la promise si le code de statut n'est pas dans la plage 200-299. Vous pouvez remplacer ce comportement en fournissant une fonction `validateStatus` personnalisée. La fonction doit retourner `true` si le code de statut est dans la plage que vous souhaitez accepter.

Par défaut, définir explicitement `validateStatus: undefined` conserve le comportement historique et résout tous les statuts de réponse, car `transitional.validateStatusUndefinedResolves` vaut `true` par défaut. Définissez `transitional.validateStatusUndefinedResolves` à `false` si vous voulez qu'un `validateStatus: undefined` explicite se comporte comme si `validateStatus` était omis : axios utilise alors le validateur configuré/par défaut et rejette les réponses non-2xx par défaut.

`validateStatus: null` accepte toujours tous les statuts de réponse. Si vous désactivez le comportement de transition et souhaitez intentionnellement résoudre tous les statuts, utilisez `validateStatus: null` ou un validateur qui retourne `true`.

```js
axios.get('/user/12345', {
  validateStatus: undefined,
  transitional: {
    validateStatusUndefinedResolves: false
  }
});
```

### `maxRedirects` <Badge type="warning" text="Node.js uniquement" />

La propriété `maxRedirects` définit le nombre maximum de redirections à suivre. Si défini à 0, aucune redirection ne sera suivie.

### `sensitiveHeaders` <Badge type="warning" text="Node.js uniquement" />

La propriété `sensitiveHeaders` est un tableau optionnel de noms d'en-têtes personnalisés contenant des secrets, comme `X-API-Key`, que l'adaptateur HTTP Node.js retire lorsqu'il suit une redirection vers une origine différente. La correspondance est insensible à la casse. Les redirections same-origin conservent ces en-têtes. Si `maxRedirects` vaut `0`, axios ne suit pas les redirections et `sensitiveHeaders` n'est pas utilisée.

```js
axios.get('https://api.example.com/users', {
  headers: { 'X-API-Key': 'secret' },
  sensitiveHeaders: ['X-API-Key']
});
```

### `beforeRedirect`

La fonction `beforeRedirect` vous permet de modifier la requête avant qu'elle ne soit redirigée. Utilisez-la pour ajuster les options de requête lors d'une redirection, inspecter les derniers en-têtes de réponse, ou annuler la requête en levant une erreur. Si `maxRedirects` est défini à 0, `beforeRedirect` n'est pas utilisé.

```js
beforeRedirect: (options, { headers }) => {
  if (
    options.hostname === "example.com" &&
    options.protocol === "https:"
  ) {
    options.auth = "user:password";
  }
}
```

::: warning Sécurité : réinjection d'identifiants lors d'une redirection
Le hook `beforeRedirect` s'exécute **après** que les en-têtes sensibles aient été retirés pendant les redirections. La bibliothèque `follow-redirects` supprime les identifiants en cas de rétrogradation de protocole (HTTPS → HTTP) pour des raisons de sécurité. Comme `beforeRedirect` s'exécute après cela, réinjecter des identifiants sans vérifier le protocole de destination peut exposer des données sensibles. Ne réinjectez les identifiants que pour des destinations HTTPS de confiance, et évitez de les réinjecter sur des redirections rétrogradées.
:::

### `socketPath` <Badge type="warning" text="Node.js uniquement" />

La propriété `socketPath` définit un socket UNIX à utiliser à la place d'une connexion TCP. Par exemple `/var/run/docker.sock` pour envoyer des requêtes au daemon Docker. Seul `socketPath` ou `proxy` peut être spécifié. Si les deux sont spécifiés, `socketPath` est utilisé.

:::warning Sécurité
Lorsque `socketPath` est défini, le hostname et le port de l'URL de la requête sont ignorés et axios communique directement avec le socket Unix indiqué. Si une partie de la configuration de la requête provient d'une entrée utilisateur (par exemple dans un proxy ou un gestionnaire de webhooks qui transfère des options), un attaquant peut injecter `socketPath` pour rediriger le trafic vers des sockets locaux privilégiés tels que `/var/run/docker.sock`, `/run/containerd/containerd.sock` ou `/run/systemd/private`, contournant entièrement les protections SSRF basées sur le hostname (CWE-918). Filtrez la configuration provenant d'entrées non fiables et/ou restreignez les chemins de socket acceptés avec `allowedSocketPaths` (voir ci-dessous).
:::

### `allowedSocketPaths` <Badge type="warning" text="Node.js uniquement" />

Restreint les chemins de socket pouvant être utilisés via `socketPath`. Accepte une chaîne ou un tableau de chaînes. Lorsqu'elle est définie, axios résout le `socketPath` et le compare à chaque entrée (également résolue) ; la requête est rejetée avec une `AxiosError` de code `ERR_BAD_OPTION_VALUE` s'il n'y a aucune correspondance. Lorsque non définie (par défaut), `socketPath` se comporte comme avant.

```js
const client = axios.create({
  allowedSocketPaths: ['/var/run/docker.sock']
});

// autorisé
await client.get('http://localhost/v1.45/info', { socketPath: '/var/run/docker.sock' });

// rejeté — pas dans la liste
await client.get('http://localhost/pods', { socketPath: '/var/run/kubelet.sock' });
```

Un tableau vide (`allowedSocketPaths: []`) bloque tous les chemins de socket.

### `transport`

La propriété `transport` définit le transport à utiliser pour la requête. Utile pour effectuer des requêtes via un protocole différent, comme `http2`.

### `httpAgent` et `httpsAgent`

Les `httpAgent` et `httpsAgent` définissent un agent personnalisé à utiliser pour les requêtes http et https respectivement dans Node.js. Cela permet d'ajouter des options comme `keepAlive` qui ne sont pas activées par défaut.

### `proxy`

Le `proxy` définit le nom d'hôte, le port et le protocole d'un serveur proxy que vous souhaitez utiliser. Vous pouvez également définir votre proxy en utilisant les variables d'environnement conventionnelles `http_proxy` et `https_proxy`.

Si vous utilisez des variables d'environnement pour la configuration de votre proxy, vous pouvez également définir une variable d'environnement `no_proxy` sous la forme d'une liste de domaines séparés par des virgules qui ne doivent pas être mandatés.

Utilisez `false` pour désactiver les proxies, en ignorant les variables d'environnement. `auth` indique que l'authentification HTTP Basic doit être utilisée pour se connecter au proxy, et fournit les identifiants. Cela définira un en-tête `Proxy-Authorization`, en écrasant tout en-tête `Proxy-Authorization` personnalisé que vous auriez défini via `headers`. Si le serveur proxy utilise HTTPS, vous devez définir le protocole à `https`.

Un en-tête `Host` fourni par l'utilisateur dans `headers` est préservé lorsqu'il est transféré via un proxy (correspondance insensible à la casse sur `host` / `Host` / `HOST`). Cela vous permet de cibler un hôte virtuel différent de l'URL de la requête — par exemple, atteindre `127.0.0.1:4000` tout en faisant traiter la requête par le proxy comme provenant de `example.com`. Si aucun en-tête `Host` n'est fourni, axios utilise par défaut le `hostname:port` de l'URL de la requête comme auparavant.

Pour les cibles `https://`, axios établit un tunnel CONNECT via le proxy et effectue TLS de bout en bout avec l'origine. `Proxy-Authorization` est envoyé uniquement sur la requête CONNECT, jamais sur la requête TLS encapsulée. Les options TLS de `httpsAgent`, comme `ca`, `cert`, `key` et `rejectUnauthorized`, sont transmises à l'agent de tunnel généré afin qu'elles continuent de s'appliquer à la connexion TLS avec l'origine. Si vous fournissez un `HttpsProxyAgent`, axios laisse cet agent gérer le tunnel.

```js
proxy: {
  protocol: "https",
  host: "127.0.0.1",
  hostname: "localhost", // Prend le dessus sur "host" si les deux sont définis
  port: 9000,
  auth: {
    username: "mikeymike",
    password: "rapunz3l"
  }
},
```

### `cancelToken`

La propriété `cancelToken` vous permet de créer un token d'annulation pouvant être utilisé pour annuler la requête. Pour plus d'informations, consultez la documentation sur l'[annulation](/pages/advanced/cancellation).

### `signal`

La propriété `signal` vous permet de passer une instance d'`AbortSignal` à la requête. Cela vous permet d'annuler la requête en utilisant l'API `AbortController`.

### `decompress` <Badge type="warning" text="Node.js uniquement" />

La propriété `decompress` indique si les données de la réponse doivent être automatiquement décompressées. La valeur par défaut est `true`. L'adaptateur HTTP Node.js prend en charge gzip, deflate, brotli et zstd lorsque le runtime Node.js actuel fournit le décompresseur zlib correspondant.

### `insecureHTTPParser`

Indique s'il faut utiliser un analyseur HTTP non sécurisé qui accepte des en-têtes HTTP invalides. Cela peut permettre l'interopérabilité avec des implémentations HTTP non conformes. L'utilisation de l'analyseur non sécurisé doit être évitée.

Notez que l'option `insecureHTTPParser` n'est disponible que dans Node.js 12.10.0 et ultérieur. Consultez la [documentation Node.js](https://nodejs.org/en/blog/vulnerability/february-2020-security-releases/#strict-http-header-parsing-none) pour plus d'informations. Voir l'ensemble complet des options [ici](https://nodejs.org/dist/latest-v12.x/docs/api/http.html#http_http_request_url_options_callback)

### `transitional`

La propriété `transitional` vous permet d'activer ou de désactiver certaines fonctionnalités de transition. Les options suivantes sont disponibles :

- `silentJSONParsing` : Si défini à `true` _(par défaut)_, axios ignore silencieusement les erreurs d'analyse JSON et définit `response.data` à `null` lorsque l'analyse échoue. Définissez à `false` pour lever une `SyntaxError` à la place.

  ::: tip Important
  Cette option ne prend effet que lorsque `responseType` est **explicitement** défini à `'json'`. Lorsque `responseType` est omis, axios utilise `forcedJSONParsing` pour tenter l'analyse JSON et retourne silencieusement la chaîne brute en cas d'échec, indépendamment de ce paramètre. Pour qu'un JSON invalide lève une erreur, définissez les deux :

  ```js
  { responseType: 'json', transitional: { silentJSONParsing: false } }
  ```
  :::

- `forcedJSONParsing` : Force axios à analyser la chaîne de réponse comme du JSON même si `responseType` n'est pas `'json'`.
- `clarifyTimeoutError` : Clarifie le message d'erreur lorsqu'une requête expire. Utile lors du débogage de problèmes de délai d'attente.
- `validateStatusUndefinedResolves` : Si défini à `true` _(par défaut)_, un `validateStatus: undefined` explicite résout tous les statuts de réponse pour préserver la compatibilité. Définissez à `false` pour traiter `undefined` explicite comme si `validateStatus` était omis, afin qu'axios utilise le validateur configuré/par défaut. Utilisez `validateStatus: null` ou un validateur qui retourne `true` lorsque vous voulez intentionnellement résoudre tous les statuts.
- `advertiseZstdAcceptEncoding` : Lorsqu'elle vaut `true`, axios ajoute `zstd` à l'en-tête `Accept-Encoding` par défaut lorsque le runtime Node.js actuel prend en charge la décompression zstd. Les réponses zstd sont tout de même décompressées automatiquement lorsqu'elles sont prises en charge et que `decompress` vaut `true`.
- `legacyInterceptorReqResOrdering` : Lorsque défini à true, l'ordre hérité de traitement requête/réponse des intercepteurs sera utilisé.

### `env`

La propriété `env` vous permet de définir certaines options de configuration. Par exemple, la classe FormData qui est utilisée pour sérialiser automatiquement le payload en objet FormData.

- FormData: window?.FormData || global?.FormData

### `formSerializer`

L'option `formSerializer` vous permet de configurer comment les objets simples sont sérialisés en `multipart/form-data` lorsqu'ils sont utilisés comme `data` de requête. Options disponibles :

- `visitor` — fonction visiteur personnalisée appelée récursivement pour chaque valeur
- `dots` — utiliser la notation pointée au lieu de la notation entre crochets
- `metaTokens` — conserver les terminaisons spéciales de clé telles que `{}`
- `indexes` — contrôler le format des crochets pour les clés de tableau (`null` / `false` / `true`)
- `maxDepth` _(par défaut : `100`)_ — profondeur maximale d'imbrication avant de lever une `AxiosError` avec le code `ERR_FORM_DATA_DEPTH_EXCEEDED`. Définir à `Infinity` pour désactiver.

Consultez la page [multipart/form-data](/pages/advanced/multipart-form-data-format) pour tous les détails, et l'exemple de configuration complète en bas de cette page.

### `maxRate` <Badge type="warning" text="Node.js uniquement" />

La propriété `maxRate` définit la **bande passante** maximale (en octets par seconde) pour l'envoi et/ou le téléchargement. Elle accepte soit un nombre unique (appliqué dans les deux sens) soit un tableau de deux éléments `[uploadRate, downloadRate]` où chaque élément est une limite en octets par seconde. Par exemple, `100 * 1024` signifie 100 Ko/s. Consultez [Limitation de débit](/pages/advanced/rate-limiting) pour des exemples.

## Exemple de configuration complète

```js
{
  url: "/posts",
  method: "get",
  baseURL: "https://jsonplaceholder.typicode.com",
  allowAbsoluteUrls: true,
  transformRequest: [function (data, headers) {
    return data;
  }],
  transformResponse: [function (data) {
    return data;
  }],
  headers: {"X-Requested-With": "XMLHttpRequest"},
  params: {
    postId: 5
  },
  paramsSerializer: {
    // Fonction d'encodage personnalisée qui envoie les paires clé/valeur de façon itérative.
    encode?: (param: string): string => { /* Effectuez des opérations personnalisées ici et retournez la chaîne transformée */ },

    // Fonction de sérialisation personnalisée pour l'ensemble du paramètre. Permet à l'utilisateur de reproduire le comportement antérieur à la v1.x.
    serialize?: (params: Record<string, any>, options?: ParamsSerializerOptions ),

    // Configuration du format des index de tableaux dans les params.
    // Trois options disponibles :
      // (1) indexes: null (pas de crochets)
      // (2) (défaut) indexes: false (crochets vides)
      // (3) indexes: true (crochets avec index).
    indexes: false,

    // Profondeur maximale d'imbrication des objets lors de la sérialisation des params. Lève une AxiosError
    // (ERR_FORM_DATA_DEPTH_EXCEEDED) si dépassée. Par défaut : 100. Définir à Infinity pour désactiver.
    maxDepth: 100

  },
  data: {
    firstName: "Fred"
  },
  formDataHeaderPolicy: "legacy",
  // Syntaxe alternative pour envoyer des données dans le corps de la méthode post : seule la valeur est envoyée, pas la clé
  data: "Country=Brasil&City=Belo Horizonte",
  timeout: 1000,
  withCredentials: false,
  adapter: function (config) {
    // Faites ce que vous voulez
  },
  adapter: "xhr",
  auth: {
    username: "janedoe",
    password: "s00pers3cret"
  },
  responseType: "json",
  responseEncoding: "utf8",
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
  withXSRFToken: boolean | undefined | ((config: InternalAxiosRequestConfig) => boolean | undefined),
  onUploadProgress: function ({loaded, total, progress, bytes, estimated, rate, upload = true}) {
    // Faites ce que vous voulez avec l'événement de progression Axios
  },
  onDownloadProgress: function ({loaded, total, progress, bytes, estimated, rate, download = true}) {
    // Faites ce que vous voulez avec l'événement de progression Axios
  },
  maxContentLength: 2000,
  maxBodyLength: 2000,
  redact: ['authorization', 'password'],
  validateStatus: function (status) {
    return status >= 200 && status < 300;
  },
  maxRedirects: 21,
  sensitiveHeaders: ['X-API-Key'],
  beforeRedirect: (options, { headers }) => {
    if (options.hostname === "typicode.com") {
      options.auth = "user:password";
    }
  },
  socketPath: null,
  allowedSocketPaths: null,
  transport: undefined,
  httpAgent: new http.Agent({ keepAlive: true }),
  httpsAgent: new https.Agent({ keepAlive: true }),
  proxy: {
    protocol: "https",
    host: "127.0.0.1",
    // hostname: "127.0.0.1" // Prend le dessus sur "host" si les deux sont définis
    port: 9000,
    auth: {
      username: "mikeymike",
      password: "rapunz3l"
    }
  },
  cancelToken: new CancelToken(function (cancel) {
    cancel("Operation has been canceled.");
  }),
  signal: new AbortController().signal,
  decompress: true,
  insecureHTTPParser: undefined,
  transitional: {
    silentJSONParsing: true,
    forcedJSONParsing: true,
    clarifyTimeoutError: false,
    validateStatusUndefinedResolves: true,
    advertiseZstdAcceptEncoding: false,
    legacyInterceptorReqResOrdering: true,
  },
  env: {
    FormData: window?.FormData || global?.FormData
  },
  formSerializer: {
      // Fonction visiteur personnalisée pour sérialiser les valeurs du formulaire
      visitor: (value, key, path, helpers) => {};

      // Utiliser des points au lieu de crochets
      dots: boolean;

      // Conserver les terminaisons spéciales comme {} dans la clé de paramètre
      metaTokens: boolean;

      // Utiliser le format des index de tableau :
        // null - pas de crochets
        // false - crochets vides
        // true - crochets avec index
      indexes: boolean;

      // Profondeur maximale d'imbrication des objets. Lève une AxiosError (ERR_FORM_DATA_DEPTH_EXCEEDED)
      // si dépassée. Par défaut : 100. Définir à Infinity pour désactiver.
      maxDepth: 100;
  },
  maxRate: [
    100 * 1024, // Limite d'envoi de 100Ko/s,
    100 * 1024  // Limite de téléchargement de 100Ko/s
  ]
}
```
