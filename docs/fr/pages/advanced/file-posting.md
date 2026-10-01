# Envoi de fichiers

axios simplifie l'envoi de fichiers. Utilisez `postForm` ou `FormData` lorsque vous avez besoin d'envois `multipart/form-data`.

## Fichier unique (navigateur)

Passez un objet `File` directement comme valeur de champ — axios le détectera et utilisera automatiquement le type de contenu correct :

```js
await axios.postForm("https://httpbin.org/post", {
  description: "My profile photo",
  file: document.querySelector("#fileInput").files[0],
});
```

## Plusieurs fichiers (navigateur)

Passez une `FileList` pour envoyer tous les fichiers sélectionnés en une seule fois. Ils seront tous envoyés sous le même nom de champ (`files[]`) :

```js
await axios.postForm(
  "https://httpbin.org/post",
  document.querySelector("#fileInput").files
);
```

Vous pouvez également passer la `FileList` (ou un tableau d'objets `File`) explicitement sous un nom de champ personnalisé en ajoutant `[]` à la clé :

```js
await axios.postForm("https://httpbin.org/post", {
  "files[]": document.querySelector("#fileInput").files,
});
```

Pour utiliser des noms de champs distincts pour chaque fichier, construisez un objet `FormData` manuellement :

```js
const formData = new FormData();
formData.append("avatar", avatarFile);
formData.append("cover", coverFile);

await axios.post("https://httpbin.org/post", formData);
```

## Suivi de la progression de l'envoi (navigateur)

Utilisez le callback `onUploadProgress` pour afficher une barre de progression ou un pourcentage à vos utilisateurs :

```js
await axios.postForm("https://httpbin.org/post", {
  file: document.querySelector("#fileInput").files[0],
}, {
  onUploadProgress: (progressEvent) => {
    const percent = Math.round(
      (progressEvent.loaded * 100) / progressEvent.total
    );
    console.log(`Upload progress: ${percent}%`);
  },
});
```

Consultez [Capture de progression](/pages/advanced/progress-capturing) pour la liste complète des champs disponibles sur l'événement de progression.

## Fichiers dans Node.js

Dans Node.js, utilisez `fs.createReadStream` pour envoyer un fichier depuis le système de fichiers sans le charger entièrement en mémoire :

```js
import fs from "fs";
import FormData from "form-data";
import axios from "axios";

const form = new FormData();
form.append("file", fs.createReadStream("/path/to/file.jpg"));
form.append("description", "My uploaded file");

await axios.post("https://httpbin.org/post", form);
```

::: tip
Le package npm `form-data` est nécessaire dans les environnements Node.js pour créer des objets `FormData`. Dans Node.js moderne (v18+), le `FormData` global est disponible nativement.
:::

## Envoi d'un Buffer (Node.js)

Vous pouvez également envoyer directement un `Buffer` en mémoire :

```js
const buffer = Buffer.from("Hello, world!");

const form = new FormData();
form.append("file", buffer, {
  filename: "hello.txt",
  contentType: "text/plain",
  knownLength: buffer.length,
});

await axios.post("https://httpbin.org/post", form);
```

::: warning
La capture de la progression d'envoi de `FormData` n'est actuellement pas supportée dans les environnements Node.js.
:::

::: danger
Lors de l'envoi d'un stream lisible dans Node.js, définissez `maxRedirects: 0` pour empêcher le package `follow-redirects` de buffériser l'intégralité du stream en RAM.
:::
