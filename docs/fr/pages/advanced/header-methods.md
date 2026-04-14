# Méthodes d'en-têtes <Badge type="tip" text="Nouveau" />

Avec l'introduction de la nouvelle classe `AxiosHeaders`, Axios fournit un ensemble de méthodes pour manipuler les en-têtes. Ces méthodes sont utilisées pour définir, récupérer et supprimer des en-têtes de manière plus pratique que la manipulation directe de l'objet d'en-têtes.

## Constructeur `new AxiosHeaders(headers?)`

Le constructeur de la classe `AxiosHeaders` accepte un objet optionnel avec des en-têtes pour initialiser l'instance. L'objet d'en-têtes peut contenir un nombre quelconque d'en-têtes, et les clés sont insensibles à la casse.

```js
constructor(headers?: RawAxiosHeaders | AxiosHeaders | string);
```

Pour plus de commodité, vous pouvez passer une chaîne avec des en-têtes séparés par un caractère de nouvelle ligne. Les en-têtes sont alors analysés et ajoutés à l'instance.

```js
const headers = new AxiosHeaders(`
Host: www.bing.com
User-Agent: curl/7.54.0
Accept: */*`);

console.log(headers);

// Object [AxiosHeaders] {
//   host: 'www.bing.com',
//   'user-agent': 'curl/7.54.0',
//   accept: '*/*'
// }
```

## Set

La méthode `set` est utilisée pour définir des en-têtes sur l'instance d'`AxiosHeaders`. La méthode peut être appelée avec un seul nom d'en-tête et une valeur, un objet avec plusieurs en-têtes, ou une chaîne avec des en-têtes séparés par un caractère de nouvelle ligne. La méthode accepte également un paramètre optionnel `rewrite` qui contrôle le comportement de définition de l'en-tête.

```js
set(headerName, value: AxiosHeaderValue, rewrite?: boolean | AxiosHeaderMatcher);
set(headerName, value, rewrite?: (this: AxiosHeaders, value: string, name: string) => boolean);
set(headers?: RawAxiosHeaders | AxiosHeaders | string, rewrite?: boolean);
```

L'argument `rewrite` contrôle le comportement d'écrasement :

- `false` - ne pas écraser si la valeur de l'en-tête est définie (n'est pas undefined)
- `undefined` (défaut) - écraser l'en-tête sauf si sa valeur est définie à false
- `true` - écraser dans tous les cas

L'option peut également accepter une fonction définie par l'utilisateur qui détermine si la valeur doit être écrasée ou non. La fonction reçoit la valeur actuelle, le nom de l'en-tête et l'objet d'en-têtes comme arguments.

`AxiosHeaders` conserve la casse de la première clé correspondante qu'il voit. Vous pouvez utiliser cela pour préserver la casse spécifique d'un en-tête en initialisant une clé avec `undefined` puis en définissant les valeurs ultérieurement. Voir [Préserver la casse d'un en-tête spécifique](/pages/advanced/headers#preserving-a-specific-header-case).

## Get

La méthode `get` est utilisée pour récupérer la valeur d'un en-tête. La méthode peut être appelée avec un seul nom d'en-tête, un matcher optionnel ou un analyseur. Le matcher est par défaut `true`. L'analyseur peut être une expression régulière utilisée pour extraire la valeur de l'en-tête.

```js
get(headerName: string, matcher?: true | AxiosHeaderParser): AxiosHeaderValue;
get(headerName: string, parser: RegExp): RegExpExecArray | null;
```

Voici un exemple de quelques-unes des utilisations possibles de la méthode `get` :

```js
const headers = new AxiosHeaders({
  'Content-Type': 'multipart/form-data; boundary=Asrf456BGe4h',
});

console.log(headers.get('Content-Type'));
// multipart/form-data; boundary=Asrf456BGe4h

console.log(headers.get('Content-Type', true)); // analyser les paires clé-valeur depuis une chaîne séparée par des délimiteurs \s,;= :
// [Object: null prototype] {
//   'multipart/form-data': undefined,
//    boundary: 'Asrf456BGe4h'
// }

console.log(
  headers.get('Content-Type', (value, name, headers) => {
    return String(value).replace(/a/g, 'ZZZ');
  })
);
// multipZZZrt/form-dZZZtZZZ; boundZZZry=Asrf456BGe4h

console.log(headers.get('Content-Type', /boundary=(\w+)/)?.[0]);
// boundary=Asrf456BGe4h
```

## Has

La méthode `has` est utilisée pour vérifier si un en-tête existe dans l'instance d'`AxiosHeaders`. La méthode peut être appelée avec un seul nom d'en-tête et un matcher optionnel.

```js
has(header: string, matcher?: AxiosHeaderMatcher): boolean;
```

::: info
Retourne true si l'en-tête est défini (n'a pas de valeur undefined).
:::

## Delete

La méthode `delete` est utilisée pour supprimer un en-tête de l'instance d'`AxiosHeaders`. La méthode peut être appelée avec un seul nom d'en-tête et un matcher optionnel.

```js
delete(header: string | string[], matcher?: AxiosHeaderMatcher): boolean;
```

::: info
Retourne true si au moins un en-tête a été supprimé.
:::

## Clear

La méthode `clear` est utilisée pour supprimer tous les en-têtes de l'instance d'`AxiosHeaders` si rien n'est passé. Si un matcher est passé, seuls les en-têtes correspondant au matcher sont supprimés ; dans ce cas, le matcher est utilisé pour correspondre au nom de l'en-tête plutôt qu'à sa valeur.

```js
clear(matcher?: AxiosHeaderMatcher): boolean;
```

::: info
Retourne true si au moins un en-tête a été effacé.
:::

## Normalize

Si l'objet d'en-têtes a été modifié directement, cela peut créer des doublons avec le même nom mais dans des casses différentes. Cette méthode normalise l'objet d'en-têtes en combinant les clés dupliquées en une seule. Axios utilise cette méthode en interne après l'appel de chaque intercepteur. Définissez `format` à `true` pour convertir les noms d'en-têtes en minuscules et capitaliser les premières lettres (cOntEnt-type => Content-Type) ou `false` pour conserver le format original.

```js
const headers = new AxiosHeaders({
  foo: '1',
});

headers.Foo = '2';
headers.FOO = '3';

console.log(headers.toJSON()); // [Object: null prototype] { foo: '1', Foo: '2', FOO: '3' }
console.log(headers.normalize().toJSON()); // [Object: null prototype] { foo: '3' }
console.log(headers.normalize(true).toJSON()); // [Object: null prototype] { Foo: '3' }
```

::: info
Retourne `this` pour le chaînage.
:::

## Concat

Fusionne l'instance avec des cibles dans une nouvelle instance AxiosHeaders. Si la cible est une chaîne, elle sera analysée comme des en-têtes HTTP bruts. Si la cible est une instance AxiosHeaders, elle sera fusionnée avec l'instance actuelle.

Utile pour les préréglages de casse lors de la composition d'en-têtes. Par exemple :

```js
const headers = AxiosHeaders.concat(
  { 'content-type': undefined },
  { 'Content-Type': 'application/octet-stream' }
);
```

```js
concat(...targets: Array<AxiosHeaders | RawAxiosHeaders | string | undefined | null>): AxiosHeaders;
```

::: info
Retourne une nouvelle instance AxiosHeaders.
:::

## toJSON

Résout toutes les valeurs d'en-têtes internes dans un nouvel objet à prototype null. Définissez `asStrings` à true pour résoudre les tableaux en une chaîne contenant tous les éléments, séparés par des virgules.

```js
toJSON(asStrings?: boolean): RawAxiosHeaders;
```

## From

Retourne une nouvelle instance d'`AxiosHeaders` créée à partir des en-têtes bruts passés, ou retourne simplement l'objet d'en-têtes donné s'il s'agit déjà d'une instance d'`AxiosHeaders`.

```js
from(thing?: AxiosHeaders | RawAxiosHeaders | string): AxiosHeaders;
```

## Raccourcis

Les raccourcis suivants sont disponibles :

- `setContentType`, `getContentType`, `hasContentType`
- `setContentLength`, `getContentLength`, `hasContentLength`
- `setAccept`, `getAccept`, `hasAccept`
- `setUserAgent`, `getUserAgent`, `hasUserAgent`
- `setContentEncoding`, `getContentEncoding`, `hasContentEncoding`
