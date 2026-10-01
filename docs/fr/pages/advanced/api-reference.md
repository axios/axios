# Référence API

Vous trouverez ci-dessous la liste de toutes les fonctions et classes disponibles dans le package axios. Ces fonctions peuvent être utilisées et importées dans votre projet. Elles sont toutes protégées par notre engagement renouvelé à respecter le versionnage sémantique. Vous pouvez donc compter sur leur stabilité dans les versions futures, sauf en cas de changement de version majeure.

## Instance

L'instance `axios` est l'objet principal que vous utiliserez pour effectuer des requêtes HTTP. C'est une fonction fabrique qui crée une nouvelle instance de la classe `Axios`. L'instance `axios` dispose d'un certain nombre de méthodes pour effectuer des requêtes HTTP. Ces méthodes sont documentées dans la [section Alias de requête](/pages/advanced/request-method-aliases) de la documentation.

## Types de requête TypeScript

Les types de requête publics utilisent des génériques distincts pour les données de requête et les paramètres de requête :

```ts
AxiosRequestConfig<D = any, P = any>
RawAxiosRequestConfig<D = any, P = any>
InternalAxiosRequestConfig<D = any, P = any>
AxiosDefaults<D = any, P = any>
CreateAxiosDefaults<D = any, P = any>

AxiosResponse<T = any, D = any, H = {}, P = any>
AxiosPromise<T = any, D = any, P = any>
AxiosError<T = unknown, D = any, P = any>
CanceledError<T, D = any, P = any>
```

`D` est le type du corps de la requête et `P` celui des paramètres de requête. `AxiosResponse`, `AxiosPromise`, les erreurs, les valeurs par défaut, les instances appelables, les alias de requête, les adaptateurs et `mergeConfig()` conservent les deux dans la configuration. Les sérialiseurs de paramètres personnalisés reçoivent le même `P`.

Les méthodes de requête utilisent l'ordre générique `<T, R, D, P>`, avec `P` ajouté en dernier afin que les arguments génériques explicites existants restent compatibles. Sans type de réponse personnalisé `R`, l'`AxiosResponse` par défaut conserve `D` et `P` dans `response.config` ; un `R` explicite continue de contrôler la valeur résolue. Les génériques des données et paramètres valent `any` par défaut pour préserver la compatibilité.

## Classes

### `Axios`

La classe `Axios` est la classe principale que vous utiliserez pour effectuer des requêtes HTTP. C'est une fonction fabrique qui crée une nouvelle instance de la classe `Axios`. La classe `Axios` dispose d'un certain nombre de méthodes pour effectuer des requêtes HTTP. Ces méthodes sont documentées dans la [section Alias de requête](/pages/advanced/request-method-aliases) de la documentation.

#### `constructor`

Crée une nouvelle instance de la classe `Axios`. Le constructeur accepte un objet de configuration optionnel en argument.

```ts
constructor(instanceConfig?: AxiosRequestConfig);
```

#### `request`

Gère l'invocation de la requête et la résolution de la réponse. C'est la méthode principale pour effectuer des requêtes HTTP. Elle accepte un objet de configuration en argument et retourne une promise qui se résout vers l'objet de réponse.

```ts
request<T, R, D, P>(config: AxiosRequestConfig<D, P>): Promise<R>;
```

### `CancelToken` <Badge type="danger" text="Déprécié en faveur d'AbortController" />

La classe `CancelToken` était basée sur la proposition `tc39/proposal-cancelable-promises`. Elle était utilisée pour créer un token permettant d'annuler une requête HTTP. La classe `CancelToken` est désormais dépréciée en faveur de l'API `AbortController`.

Depuis la version 0.22.0, la classe `CancelToken` est dépréciée et sera supprimée dans une prochaine version. Il est recommandé d'utiliser l'API `AbortController` à la place.

La classe est exportée principalement pour des raisons de rétrocompatibilité et sera supprimée dans une prochaine version. Nous déconseillons fortement son utilisation dans de nouveaux projets ; les helpers d'interopérabilité hérités ci-dessous ne sont listés que pour le code existant.

Les méthodes héritées restent typées pour les intégrations existantes :

```ts
subscribe(listener: (cancel: Cancel | any) => void): void;
unsubscribe(listener: (cancel: Cancel | any) => void): void;
toAbortSignal(): AbortSignal;
```

## Fonctions

### `AxiosError`

La classe `AxiosError` est une classe d'erreur levée lorsqu'une requête HTTP échoue. Elle étend la classe `Error` et ajoute des propriétés supplémentaires à l'objet d'erreur.

#### `constructor`

Crée une nouvelle instance de la classe `AxiosError`. Le constructeur accepte en argument un message, un code, une configuration, une requête et une réponse optionnels.

```ts
constructor(message?: string, code?: string, config?: InternalAxiosRequestConfig<D, P>, request?: any, response?: AxiosResponse<T, D, {}, P>);
```

#### `properties`

La classe `AxiosError` fournit les propriétés suivantes :

```ts
// Instance de config.
config?: InternalAxiosRequestConfig<D, P>;

// Code d'erreur.
code?: string;

// Instance de requête.
request?: any;

// Instance de réponse.
response?: AxiosResponse<T, D, {}, P>;

// Booléen indiquant si l'erreur est une `AxiosError`.
isAxiosError: boolean;

// Code de statut HTTP de l'erreur.
status?: number;

// Méthode utilitaire pour convertir l'erreur en objet JSON.
toJSON: () => object;

// Cause de l'erreur.
cause?: Error;
```

### `AxiosHeaders`

La classe `AxiosHeaders` est une classe utilitaire permettant de gérer les en-têtes HTTP. Elle fournit des méthodes pour manipuler les en-têtes, comme l'ajout, la suppression et la récupération d'en-têtes.

Seules les méthodes principales sont documentées ici. Pour la liste complète des méthodes, référez-vous au fichier de déclaration de types.

#### `constructor`

Crée une nouvelle instance de la classe `AxiosHeaders`. Le constructeur accepte un objet d'en-têtes optionnel en argument.

```ts
constructor(headers?: RawAxiosHeaders | AxiosHeaders | string);
```

#### `set`

Ajoute un en-tête à l'objet d'en-têtes.
Les noms d'en-têtes vides ou composés uniquement d'espaces sont ignorés.

```ts
set(headerName?: string, value?: AxiosHeaderValue, rewrite?: boolean | AxiosHeaderMatcher): AxiosHeaders;
set(headers?: RawAxiosHeaders | AxiosHeaders | string, rewrite?: boolean): AxiosHeaders;
set(headers?: Iterable<[string, AxiosHeaderValue]>, rewrite?: boolean): AxiosHeaders;
```

#### `get`

Récupère un en-tête depuis l'objet d'en-têtes.

```ts
get(headerName: string, parser: typeof AxiosHeaders.parseParameters): AxiosHeaderParameters;
get(headerName: string, parser: RegExp): RegExpExecArray | null;
get(headerName: string, matcher?: true | AxiosHeaderParser): AxiosHeaderValue;
```

Passez `AxiosHeaders.parseParameters` pour analyser des paramètres HTTP normalisés dans une map renforcée à prototype nul :

```js
const headers = new AxiosHeaders({
  "Content-Type": 'multipart/form-data; boundary="a,b"',
});

console.log({
  ...headers.get("Content-Type", AxiosHeaders.parseParameters),
});
// { boundary: "a,b" }
```

Les noms de paramètres sont insensibles à la casse. L'analyseur retire les délimiteurs des chaînes entre guillemets, décode les guillemets et barres obliques inverses échappés, conserve les virgules et points-virgules dans les valeurs entre guillemets et ne retire que les espaces optionnels RFC autour des valeurs sans guillemets. Il omet `__proto__`, `constructor` et `prototype`. `get(name, true)` reste le tokenizer historique.

#### `has`

Vérifie si un en-tête existe dans l'objet d'en-têtes.

```ts
has(header: string, matcher?: AxiosHeaderMatcher): boolean;
```

#### `delete`

Supprime un en-tête de l'objet d'en-têtes.

```ts
delete(header: string | string[], matcher?: AxiosHeaderMatcher): boolean;
```

#### `clear`

Supprime tous les en-têtes de l'objet d'en-têtes.

```ts
clear(matcher?: AxiosHeaderMatcher): boolean;
```

#### `normalize`

Normalise l'objet d'en-têtes.

```ts
normalize(format: boolean): AxiosHeaders;
```

#### `concat`

Concatène des objets d'en-têtes.

```ts
concat(...targets: Array<AxiosHeaders | RawAxiosHeaders | string | undefined | null>): AxiosHeaders;
```

#### `toJSON`

Convertit l'objet d'en-têtes en objet JSON.

```ts
toJSON(asStrings: true): Record<string, string>;
toJSON(asStrings?: false): Record<string, string | string[]>;
```

#### `toString`

Retourne les en-têtes sous forme de bloc d'en-têtes HTTP sans CRLF, avec une paire `nom: valeur` par ligne.

```ts
toString(): string;
```

### `CanceledError` <Badge type="tip" text="Extension d'AxiosError" />

La classe `CanceledError` est une classe d'erreur levée lorsqu'une requête HTTP est annulée. Elle étend la classe `AxiosError`.

```ts
constructor(message?: string, config?: InternalAxiosRequestConfig<D, P>, request?: any);
__CANCEL__?: boolean;
```

### `Cancel` <Badge type="tip" text="Alias de CanceledError" />

La classe `Cancel` est un alias de la classe `CanceledError`. Elle est exportée pour des raisons de rétrocompatibilité et sera supprimée dans une prochaine version.

```ts
Cancel: typeof CanceledError;
```

### `isCancel`

Une fonction qui vérifie si une erreur est une `CanceledError`. Utile pour distinguer les annulations intentionnelles des erreurs inattendues.

```ts
isCancel<T = any, D = any, P = any>(value: any): value is CanceledError<T, D, P>;
```

```js
import axios from 'axios';

const controller = new AbortController();

axios.get('/api/data', { signal: controller.signal }).catch((error) => {
  if (axios.isCancel(error)) {
    console.log('Request was cancelled:', error.message);
  } else {
    console.error('Unexpected error:', error);
  }
});

controller.abort('User navigated away');
```

### `isAxiosError`

Une fonction qui vérifie si une erreur est une `AxiosError`. Utilisez-la dans les blocs `catch` pour accéder en toute sécurité aux propriétés spécifiques d'axios comme `error.response` et `error.config`.

```ts
isAxiosError(value: any): value is AxiosError;
```

```js
import axios from 'axios';

try {
  await axios.get('/api/resource');
} catch (error) {
  if (axios.isAxiosError(error)) {
    // error.response, error.config, error.code sont tous disponibles
    console.error('HTTP error', error.response?.status, error.message);
  } else {
    // Une erreur non-axios (ex. une erreur de programmation)
    throw error;
  }
}
```

### `all` <Badge type="danger" text="Déprécié en faveur de Promise.all" />

La fonction `all` est une fonction utilitaire qui prend un tableau de promises et retourne une promise unique qui se résout lorsque toutes les promises du tableau sont résolues. La fonction `all` est désormais dépréciée en faveur de la méthode `Promise.all`. Il est recommandé d'utiliser `Promise.all` à la place.

Depuis la version 0.22.0, la fonction `all` est dépréciée et sera supprimée dans une prochaine version.

### `spread`

La fonction `spread` est une fonction utilitaire qui peut être utilisée pour décomposer un tableau d'arguments dans un appel de fonction. Utile lorsque vous avez un tableau d'arguments à passer à une fonction qui en accepte plusieurs.

```ts
spread<T, R>(callback: (...args: T[]) => R): (array: T[]) => R;
```

### `toFormData`

Convertit un objet JavaScript simple (ou imbriqué) en instance `FormData`. Utile pour construire programmatiquement des données de formulaire multipart à partir d'un objet.

```ts
toFormData(sourceObj: object, formData?: FormData, options?: FormSerializerOptions): FormData;
```

```js
import { toFormData } from 'axios';

const data = { name: 'Jay', avatar: fileBlob };
const form = toFormData(data);
// form est maintenant une instance FormData prête à être envoyée
await axios.post('/api/users', form);
```

### `formToJSON`

Convertit une instance `FormData` en objet JavaScript simple. Utile pour lire les données d'un formulaire dans un format structuré.

Seules les notations par points et crochets sont structurelles : `.`, `[` et `]` séparent les chemins, tandis que `-`, les espaces, `+`, `*` et `&` restent dans les clés littérales. `foo.bar` et `foo[bar]` créent des objets imbriqués, et `foo[]` crée un tableau.

```ts
formToJSON(form: FormData): object;
```

```js
import { formToJSON } from 'axios';

const form = new FormData();
form.append('user-name', 'johndoe');
form.append('user.name', 'john');

const obj = formToJSON(form);
console.log(obj);
// { "user-name": "johndoe", user: { name: "john" } }
```

### `getAdapter`

Résout et retourne une fonction d'adaptateur par nom ou en passant un tableau de noms candidats. axios utilise ceci en interne pour sélectionner le meilleur adaptateur disponible pour l'environnement actuel.

```ts
getAdapter(adapters: string | string[]): AxiosAdapter;
```

```js
import { getAdapter } from 'axios';

// Obtenir explicitement l'adaptateur fetch
const fetchAdapter = getAdapter('fetch');

// Obtenir le meilleur adaptateur disponible depuis une liste de priorité
const adapter = getAdapter(['fetch', 'xhr', 'http']);
```

### `mergeConfig`

Fusionne deux objets de configuration axios, en appliquant la même stratégie de fusion profonde qu'axios utilise en interne lors de la combinaison des valeurs par défaut avec les options par requête. Les valeurs ultérieures ont la priorité.

```ts
mergeConfig<D = any, P = any>(
  config1: AxiosRequestConfig<D, P>,
  config2: AxiosRequestConfig<D, P>
): AxiosRequestConfig<D, P>;
```

```js
import { mergeConfig } from 'axios';

const base = { baseURL: 'https://api.example.com', timeout: 5000 };
const override = { timeout: 10000, headers: { 'X-Custom': 'value' } };

const merged = mergeConfig(base, override);
// { baseURL: "https://api.example.com", timeout: 10000, headers: { "X-Custom": "value" } }
```

## Constantes

### `HttpStatusCode`

Un objet contenant une liste de codes de statut HTTP sous forme de constantes nommées. Utilisez-le pour écrire des conditions lisibles plutôt que des nombres bruts.

```js
import axios, { HttpStatusCode } from 'axios';

try {
  const response = await axios.get('/api/resource');
} catch (error) {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === HttpStatusCode.NotFound) {
      console.error('Resource not found');
    } else if (error.response?.status === HttpStatusCode.Unauthorized) {
      console.error('Authentication required');
    }
  }
}
```

## Divers

### `VERSION`

La version actuelle du package `axios`. Il s'agit d'une chaîne représentant le numéro de version du package, mise à jour à chaque nouvelle version.
