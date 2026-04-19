# Configuration de requête

La configuration de requête est utilisée pour paramétrer la requête. Un large éventail d'options est disponible, mais la seule option obligatoire est `url`. Si l'objet de configuration ne contient pas de champ `method`, la méthode par défaut est `GET`.

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

### `headers`

Les `headers` sont les en-têtes HTTP à envoyer avec la requête. L'en-tête `Content-Type` est défini à `application/json` par défaut.

### `params`

Les `params` sont les paramètres d'URL à envoyer avec la requête. Il doit s'agir d'un objet simple ou d'un objet URLSearchParams. Si l'`url` contient des paramètres de requête, ils seront fusionnés avec l'objet `params`.

### `paramsSerializer`

La fonction `paramsSerializer` vous permet de sérialiser l'objet `params` avant son envoi au serveur. Plusieurs options sont disponibles pour cette fonction ; veuillez vous référer à l'exemple de configuration complète en bas de cette page.

### `data`

Les `data` sont les données à envoyer comme corps de la requête. Il peut s'agir d'une chaîne, d'un objet simple, d'un Buffer, d'un ArrayBuffer, d'un FormData, d'un Stream ou d'un URLSearchParams. Ne s'applique que pour les méthodes de requête `PUT`, `POST`, `DELETE` et `PATCH`. Sans `transformRequest`, doit être de l'un des types suivants :

- chaîne, objet simple, ArrayBuffer, ArrayBufferView, URLSearchParams
- Navigateur uniquement : FormData, File, Blob
- Node uniquement : Stream, Buffer, FormData (package form-data)

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

`auth` indique que l'authentification HTTP Basic doit être utilisée, et fournit les identifiants. Cela définira un en-tête `Authorization`, en écrasant tout en-tête `Authorization` personnalisé que vous auriez défini via `headers`. Notez que seule l'authentification HTTP Basic est configurable via ce paramètre. Pour les tokens Bearer et similaires, utilisez plutôt des en-têtes `Authorization` personnalisés.

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

La propriété `withXSRFToken` indique si le token `XSRF` doit être envoyé avec la requête. Ne s'applique qu'aux requêtes côté client. La valeur par défaut est `undefined`.

### `onUploadProgress`

La fonction `onUploadProgress` vous permet d'écouter la progression d'un envoi.

### `onDownloadProgress`

La fonction `onDownloadProgress` vous permet d'écouter la progression d'un téléchargement.

### `maxContentLength` <Badge type="warning" text="Node.js uniquement" />

La propriété `maxContentLength` définit le nombre maximum d'octets que le serveur acceptera dans la réponse.

> ⚠️ **Sécurité :** la valeur par défaut est `-1` (illimitée). Des réponses non bornées combinées à la décompression gzip/deflate/brotli rendent possible un déni de service par bombe de décompression.
> Définissez une limite explicite lorsque vous consommez des serveurs auxquels vous ne faites pas pleinement confiance.

### `maxBodyLength` <Badge type="warning" text="Node.js uniquement" />

La propriété `maxBodyLength` définit le nombre maximum d'octets que le serveur acceptera dans la requête.

### `validateStatus`

La fonction `validateStatus` vous permet de remplacer la validation du code de statut par défaut. Par défaut, axios rejette la promise si le code de statut n'est pas dans la plage 200-299. Vous pouvez remplacer ce comportement en fournissant une fonction `validateStatus` personnalisée. La fonction doit retourner `true` si le code de statut est dans la plage que vous souhaitez accepter.

### `maxRedirects` <Badge type="warning" text="Node.js uniquement" />

La propriété `maxRedirects` définit le nombre maximum de redirections à suivre. Si défini à 0, aucune redirection ne sera suivie.

### `beforeRedirect`

La fonction `beforeRedirect` vous permet de modifier la requête avant qu'elle ne soit redirigée. Utilisez-la pour ajuster les options de requête lors d'une redirection, inspecter les derniers en-têtes de réponse, ou annuler la requête en levant une erreur. Si `maxRedirects` est défini à 0, `beforeRedirect` n'est pas utilisé.

### `socketPath` <Badge type="warning" text="Node.js uniquement" />

La propriété `socketPath` définit un socket UNIX à utiliser à la place d'une connexion TCP. Par exemple `/var/run/docker.sock` pour envoyer des requêtes au daemon Docker. Seul `socketPath` ou `proxy` peut être spécifié. Si les deux sont spécifiés, `socketPath` est utilisé.

### `transport`

La propriété `transport` définit le transport à utiliser pour la requête. Utile pour effectuer des requêtes via un protocole différent, comme `http2`.

### `httpAgent` et `httpsAgent`

Les `httpAgent` et `httpsAgent` définissent un agent personnalisé à utiliser pour les requêtes http et https respectivement dans Node.js. Cela permet d'ajouter des options comme `keepAlive` qui ne sont pas activées par défaut.

### `proxy`

Le `proxy` définit le nom d'hôte, le port et le protocole d'un serveur proxy que vous souhaitez utiliser. Vous pouvez également définir votre proxy en utilisant les variables d'environnement conventionnelles `http_proxy` et `https_proxy`.

Si vous utilisez des variables d'environnement pour la configuration de votre proxy, vous pouvez également définir une variable d'environnement `no_proxy` sous la forme d'une liste de domaines séparés par des virgules qui ne doivent pas être mandatés.

Utilisez `false` pour désactiver les proxies, en ignorant les variables d'environnement. `auth` indique que l'authentification HTTP Basic doit être utilisée pour se connecter au proxy, et fournit les identifiants. Cela définira un en-tête `Proxy-Authorization`, en écrasant tout en-tête `Proxy-Authorization` personnalisé que vous auriez défini via `headers`. Si le serveur proxy utilise HTTPS, vous devez définir le protocole à `https`.

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

La propriété `decompress` indique si les données de la réponse doivent être automatiquement décompressées. La valeur par défaut est `true`.

### `insecureHTTPParser`

Indique s'il faut utiliser un analyseur HTTP non sécurisé qui accepte des en-têtes HTTP invalides. Cela peut permettre l'interopérabilité avec des implémentations HTTP non conformes. L'utilisation de l'analyseur non sécurisé doit être évitée.

Notez que l'option `insecureHTTPParser` n'est disponible que dans Node.js 12.10.0 et ultérieur. Consultez la [documentation Node.js](https://nodejs.org/en/blog/vulnerability/february-2020-security-releases/#strict-http-header-parsing-none) pour plus d'informations. Voir l'ensemble complet des options [ici](https://nodejs.org/dist/latest-v12.x/docs/api/http.html#http_http_request_url_options_callback)

### `transitional`

La propriété `transitional` vous permet d'activer ou de désactiver certaines fonctionnalités de transition. Les options suivantes sont disponibles :

- `silentJSONParsing` : Si défini à `true`, axios n'affichera pas d'avertissement lorsqu'il rencontre des réponses JSON invalides, définissant la valeur de retour à null. Utile lorsque vous travaillez avec des APIs qui retournent du JSON invalide.
- `forcedJSONParsing` : Force axios à analyser les réponses JSON comme du JSON, même si la réponse n'est pas du JSON valide. Utile lorsque vous travaillez avec des APIs qui retournent du JSON invalide.
- `clarifyTimeoutError` : Clarifie le message d'erreur lorsqu'une requête expire. Utile lors du débogage de problèmes de délai d'attente.
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
  validateStatus: function (status) {
    return status >= 200 && status < 300;
  },
  maxRedirects: 21,
  beforeRedirect: (options, { headers }) => {
    if (options.hostname === "typicode.com") {
      options.auth = "user:password";
    }
  },
  socketPath: null,
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
