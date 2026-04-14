# Format multipart/form-data

axios peut envoyer des requêtes au format `multipart/form-data`. Ce format est couramment utilisé lors de l'envoi de fichiers. Pour envoyer une requête dans ce format, vous devez créer un objet `FormData` et y ajouter les données. Vous pouvez ensuite passer l'objet `FormData` à la propriété `data` de la configuration de requête axios.

```js
const formData = new FormData();
formData.append("foo", "bar");

axios.post("https://httpbin.org/post", formData);
```

Dans Node.js, vous pouvez utiliser la bibliothèque `form-data` comme suit :

```js
const FormData = require("form-data");

const form = new FormData();
form.append("my_field", "my value");
form.append("my_buffer", Buffer.alloc(10));
form.append("my_file", fs.createReadStream("/foo/bar.jpg"));

axios.post("https://example.com", form);
```

## Sérialisation automatique vers FormData <Badge type="tip" text="Nouveau" />

À partir de la version v0.27.0, Axios prend en charge la sérialisation automatique d'objets en objet FormData si l'en-tête Content-Type de la requête est défini à multipart/form-data. Cela signifie que vous pouvez passer directement un objet JavaScript à la propriété data de la configuration de requête axios. Par exemple lors de l'envoi de données vers une requête POST :

```js
import axios from "axios";

axios
  .post(
    "https://httpbin.org/post",
    { x: 1 },
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  )
  .then(({ data }) => console.log(data));
```

Dans la version Node.js, le polyfill ([`form-data`](https://github.com/form-data/form-data)) est utilisé par défaut. Vous pouvez remplacer la classe FormData en définissant la variable de configuration env.FormData, mais vous n'en aurez probablement pas besoin dans la plupart des cas :

```js
const axios = require("axios");
var FormData = require("form-data");

axios
  .post(
    "https://httpbin.org/post",
    { x: 1, buf: Buffer.alloc(10) },
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  )
  .then(({ data }) => console.log(data));
```

## Terminaisons supportées

Le sérialiseur FormData d'Axios supporte quelques terminaisons spéciales pour effectuer les opérations suivantes :

- `{}` - sérialiser la valeur avec JSON.stringify
- `[]` - décomposer l'objet de type tableau en champs séparés avec la même clé

::: warning
Remarque : l'opération de décomposition/expansion sera utilisée par défaut sur les tableaux et les objets FileList
:::

## Configurer le sérialiseur FormData

Le sérialiseur FormData supporte des options supplémentaires via la propriété d'objet config.formSerializer pour gérer les cas particuliers :

- `visitor: Function` - fonction visiteur définie par l'utilisateur qui sera appelée récursivement pour sérialiser l'objet de données en objet FormData en suivant des règles personnalisées.
- `dots: boolean = false` - utiliser la notation pointée au lieu de crochets pour sérialiser les tableaux et les objets ;
- `metaTokens: boolean = true` - ajouter la terminaison spéciale (ex. `user{}: '{"name": "John"}'`) dans la clé FormData. Le body-parser du backend pourrait potentiellement utiliser ces méta-informations pour analyser automatiquement la valeur en JSON.
- `indexes: null|false|true = false` - contrôle comment les index seront ajoutés aux clés décomposées d'objets de type tableau plat
  - `null` - ne pas ajouter de crochets (`arr: 1`, `arr: 2`, `arr: 3`)
  - `false` (défaut) - ajouter des crochets vides (`arr[]: 1`, `arr[]: 2`, `arr[]: 3`)
  - `true` - ajouter des crochets avec index (`arr[0]: 1`, `arr[1]: 2`, `arr[2]: 3`)

Par exemple, si nous avons un objet comme celui-ci :

```js
const obj = {
  x: 1,
  arr: [1, 2, 3],
  arr2: [1, [2], 3],
  users: [
    { name: "Peter", surname: "Griffin" },
    { name: "Thomas", surname: "Anderson" },
  ],
  "obj2{}": [{ x: 1 }],
};
```

Les étapes suivantes seront exécutées en interne par le sérialiseur Axios :

```js
const formData = new FormData();
formData.append("x", "1");
formData.append("arr[]", "1");
formData.append("arr[]", "2");
formData.append("arr[]", "3");
formData.append("arr2[0]", "1");
formData.append("arr2[1][0]", "2");
formData.append("arr2[2]", "3");
formData.append("users[0][name]", "Peter");
formData.append("users[0][surname]", "Griffin");
formData.append("users[1][name]", "Thomas");
formData.append("users[1][surname]", "Anderson");
formData.append("obj2{}", '[{"x":1}]');
```

Axios supporte les méthodes raccourcies suivantes : `postForm`, `putForm`, `patchForm` qui sont simplement les méthodes HTTP correspondantes avec l'en-tête `Content-Type` prédéfini à `multipart/form-data`.
