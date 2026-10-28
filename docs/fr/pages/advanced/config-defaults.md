# Valeurs par défaut de configuration

axios vous permet de spécifier des valeurs par défaut de configuration qui seront appliquées à toutes les requêtes. Vous pouvez définir des valeurs par défaut pour `baseURL`, `headers`, `timeout` et d'autres propriétés. Voici un exemple d'utilisation des valeurs par défaut de configuration :

```js
axios.defaults.baseURL = "https://jsonplaceholder.typicode.com/posts";
axios.defaults.headers.common["Authorization"] = AUTH_TOKEN;
axios.defaults.headers.post["Content-Type"] =
  "application/x-www-form-urlencoded";
```

::: warning Les en-têtes globaux sont envoyés à chaque hôte
Si votre application communique avec plus d'un domaine, définir `axios.defaults.headers.common["Authorization"]` enverra le token à **tous** ces domaines, y compris à des APIs tierces que vous ne contrôlez peut-être pas. Utilisez une [instance personnalisée](#valeurs-par-défaut-d-une-instance-personnalisée) avec une `baseURL` limitée pour tout client qui transporte des identifiants.
:::

## Valeurs par défaut des en-têtes par méthode

`headers.common` s'applique à toutes les requêtes, tandis que `headers.get`, `headers.post` et les autres noms de méthode en minuscules ne s'appliquent qu'aux requêtes utilisant cette méthode. Ces groupes de valeurs par défaut doivent être des objets simples, des objets à prototype nul ou des instances d'`AxiosHeaders`. Toute autre valeur placée sous l'une de ces clés est traitée comme une valeur d'en-tête littérale ; consultez [En-têtes portant le nom d'une méthode HTTP](/fr/pages/advanced/headers#en-tetes-portant-le-nom-d-une-methode-http).

Si vous construisez les valeurs par défaut avec votre propre classe, convertissez l'instance avant de l'affecter comme groupe :

```js
import axios, { AxiosHeaders } from 'axios';

const instance = axios.create({
  headers: {
    // Les deux conservent les entrées d'en-têtes propres et énumérables de l'instance comme valeurs par défaut POST
    post: { ...customDefaults },
    // ou : post: new AxiosHeaders({ ...customDefaults }),
  },
});
```

::: warning
Une instance de classe arbitraire affectée sous `common` ou un nom de méthode n'est pas utilisée comme groupe. Sa représentation sous forme de chaîne est envoyée comme en-tête littéral (par exemple, `post: [object Object]`) à chaque requête, y compris les requêtes utilisant d'autres méthodes. Une méthode `toString()` personnalisée peut ainsi exposer le contenu de l'instance.
:::

## Valeurs par défaut d'une instance personnalisée

Les instances axios sont déclarées avec leurs propres valeurs par défaut lors de leur création. Ces valeurs par défaut peuvent être remplacées en définissant la propriété `defaults` de l'instance. Voici un exemple d'utilisation des valeurs par défaut d'une instance personnalisée :

```js
var instance = axios.create({
  baseURL: "https://jsonplaceholder.typicode.com/posts",
  timeout: 1000,
  headers: { Authorization: "foobar" },
});

instance.defaults.headers.common["Authorization"] = AUTH_TOKEN;
```

## Ordre de priorité de la configuration

La configuration est fusionnée selon un ordre de priorité. L'ordre est le suivant : d'abord les valeurs par défaut de la bibliothèque, puis les propriétés par défaut de l'instance, et enfin l'argument de configuration de la requête. Voici un exemple de cet ordre de priorité :

Certaines options sont propres à chaque requête et ne sont lues que depuis la configuration de la requête. `data` en fait partie : axios n'hérite pas des corps de requête depuis les valeurs par défaut globales ou d'instance et ne les fusionne pas en profondeur. Si chaque requête doit inclure des champs de corps communs, ajoutez-les avec un intercepteur de requête ou `transformRequest`, en limitant soigneusement cette logique pour éviter d'envoyer des valeurs sensibles au mauvais point de terminaison.

Créons d'abord une instance avec les valeurs par défaut fournies par la bibliothèque. À ce stade, la valeur de configuration du timeout est `0`, valeur par défaut de la bibliothèque.

```js
const instance = axios.create();
```

Nous allons maintenant remplacer la valeur par défaut du timeout pour l'instance par `2500` millisecondes. Désormais, toutes les requêtes utilisant cette instance attendront 2,5 secondes avant d'expirer.

```js
instance.defaults.timeout = 2500;
```

Enfin, nous allons effectuer une requête avec un timeout de `5000` millisecondes. Cette requête attendra 5 secondes avant d'expirer.

```js
instance.get("/longRequest", {
  timeout: 5000,
});
```
