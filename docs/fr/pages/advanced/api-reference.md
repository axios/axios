# Référence API

Vous trouverez ci-dessous la liste de toutes les fonctions et classes disponibles dans le package axios. Ces fonctions peuvent être utilisées et importées dans votre projet. Elles sont toutes protégées par notre engagement renouvelé à respecter le versionnage sémantique. Vous pouvez donc compter sur leur stabilité dans les versions futures, sauf en cas de changement de version majeure.

## Instance

L'instance `axios` est l'objet principal que vous utiliserez pour effectuer des requêtes HTTP. C'est une fonction fabrique qui crée une nouvelle instance de la classe `Axios`. L'instance `axios` dispose d'un certain nombre de méthodes pour effectuer des requêtes HTTP. Ces méthodes sont documentées dans la [section Alias de requête](/pages/advanced/request-method-aliases) de la documentation.

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
request(configOrUrl: string | AxiosRequestConfig<D>, config: AxiosRequestConfig<D>): Promise<AxiosResponse<T>>;
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
constructor(message?: string, code?: string, config?: InternalAxiosRequestConfig<D>, request?: any, response?: AxiosResponse<T, D>);
```

#### `properties`

La classe `AxiosError` fournit les propriétés suivantes :

```ts
// Instance de config.
config?: InternalAxiosRequestConfig<D>;

// Code d'erreur.
code?: string;

// Instance de requête.
request?: any;

// Instance de réponse.
response?: AxiosResponse<T, D>;

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
get(headerName: string, parser: RegExp): RegExpExecArray | null;
get(headerName: string, matcher?: true | AxiosHeaderParser): AxiosHeaderValue;
```

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
constructor(message?: string, config?: InternalAxiosRequestConfig, request?: any);
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
isCancel<T = any>(value: any): value is CanceledError<T>;
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

```ts
formToJSON(form: FormData): object;
```

```js
import { formToJSON } from 'axios';

const form = new FormData();
form.append('name', 'Jay');
form.append('role', 'admin');

const obj = formToJSON(form);
console.log(obj); // { name: "Jay", role: "admin" }
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
mergeConfig<T>(config1: AxiosRequestConfig<T>, config2: AxiosRequestConfig<T>): AxiosRequestConfig<T>;
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
