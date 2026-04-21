# Valeurs par défaut de configuration

axios vous permet de spécifier des valeurs par défaut de configuration qui seront appliquées à toutes les requêtes. Vous pouvez définir des valeurs par défaut pour `baseURL`, `headers`, `timeout` et d'autres propriétés. Voici un exemple d'utilisation des valeurs par défaut de configuration :

```js
axios.defaults.baseURL = "https://jsonplaceholder.typicode.com/posts";
axios.defaults.headers.common["Authorization"] = AUTH_TOKEN;
axios.defaults.headers.post["Content-Type"] =
  "application/x-www-form-urlencoded";
```

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
