# Premiers pas

Bienvenue dans la documentation d'axios ! Ce guide vous aidera à démarrer avec axios et à effectuer votre première requête API. Si vous débutez avec axios, nous vous recommandons de commencer ici.

## Installation

Vous pouvez utiliser axios dans votre projet de plusieurs façons. La méthode la plus courante consiste à l'installer depuis npm et à l'inclure dans votre projet. Nous supportons également jsDelivr, unpkg, et d'autres options.

#### Avec npm

```bash
npm install axios
```

#### Avec pnpm

```bash
pnpm install axios
```

#### Avec yarn

```bash
yarn add axios
```

#### Avec bun

```bash
bun add axios
```

#### Avec deno

```bash
deno install npm:axios
```

#### Avec jsDelivr

Lors de l'utilisation de jsDelivr, nous recommandons d'utiliser la version minifiée ainsi que d'épingler le numéro de version afin d'éviter des changements inattendus. Si vous souhaitez utiliser la dernière version, vous pouvez le faire en omettant le numéro de version. Ceci est fortement déconseillé en production car cela peut entraîner des modifications inattendues dans votre application.

```html
<script src="https://cdn.jsdelivr.net/npm/axios@<x.x.x>/dist/axios.min.js"></script>
```

#### Avec unpkg

Lors de l'utilisation d'unpkg, nous recommandons d'utiliser la version minifiée ainsi que d'épingler le numéro de version afin d'éviter des changements inattendus. Si vous souhaitez utiliser la dernière version, vous pouvez le faire en omettant le numéro de version. Ceci est fortement déconseillé en production car cela peut entraîner des modifications inattendues dans votre application.

```html
<script src="https://unpkg.com/axios@<x.x.x>/dist/axios.min.js"></script>
```

## Votre première requête

Une requête axios peut être effectuée en seulement deux lignes de code. Envoyer votre première requête avec axios est très simple. Vous pouvez interroger n'importe quelle API en fournissant l'URL et la méthode. Par exemple, pour effectuer une requête GET vers l'API JSONPlaceholder, vous pouvez utiliser le code suivant :

```js
import axios from "axios";

const response = await axios.get(
  "https://jsonplaceholder.typicode.com/posts/1"
);

console.log(response.data);
```

axios propose une API simple pour effectuer des requêtes. Vous pouvez utiliser la méthode `axios.get` pour une requête GET, la méthode `axios.post` pour une requête POST, et ainsi de suite. Vous pouvez également utiliser la méthode `axios.request` pour effectuer une requête avec n'importe quelle méthode HTTP.

## Prochaines étapes

Maintenant que vous avez effectué votre première requête avec axios, vous êtes prêt à explorer le reste de la documentation. Vous pouvez en apprendre davantage sur l'envoi de requêtes, la gestion des réponses et l'utilisation d'axios dans vos projets. Consultez le reste de la documentation pour en savoir plus.
