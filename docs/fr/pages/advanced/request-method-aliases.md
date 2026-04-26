# Alias de requête

axios fournit un ensemble d'alias pour effectuer des requêtes HTTP. Ces alias sont des raccourcis pour effectuer des requêtes via la méthode `request`. Ils sont conçus pour être faciles à utiliser et offrir une façon plus pratique d'effectuer des requêtes.

axios s'efforce de suivre les RFC 7231 et RFC 5789 aussi fidèlement que possible. Les alias sont conçus pour être cohérents avec les méthodes HTTP définies dans ces RFC.

### `axios`

axios peut être utilisé pour effectuer une requête HTTP en passant uniquement l'objet de configuration. L'objet de configuration complet est documenté [ici](/pages/advanced/request-config)

```ts
axios(url: string | AxiosRequestConfig, config?: AxiosRequestConfig);
```

## Alias de méthode

Les alias suivants sont disponibles pour effectuer des requêtes :

### `request`

La méthode `request` est la méthode principale pour effectuer des requêtes HTTP. Elle accepte un objet de configuration en argument et retourne une promise qui se résout vers l'objet de réponse. C'est une méthode générique pouvant être utilisée pour tout type de requête HTTP.

```ts
axios.request(config: AxiosRequestConfig<C>): AxiosResponse<R>;
```

### `get`

La méthode `get` est utilisée pour effectuer une requête GET. Elle accepte une URL et un objet de configuration optionnel en arguments et retourne une promise qui se résout vers l'objet de réponse.

```ts
axios.get(url: string, config?: AxiosRequestConfig<C>): AxiosResponse<R>;
```

### `delete`

La méthode `delete` est utilisée pour effectuer une requête DELETE. Elle accepte une URL et un objet de configuration optionnel en arguments et retourne une promise qui se résout vers l'objet de réponse.

```ts
axios.delete(url: string, config?: AxiosRequestConfig<C>): AxiosResponse<R>;
```

### `head`

La méthode `head` est utilisée pour effectuer une requête HEAD. Elle accepte une URL et un objet de configuration optionnel en arguments et retourne une promise qui se résout vers l'objet de réponse.

```ts
axios.head(url: string, config?: AxiosRequestConfig<C>): AxiosResponse<R>;
```

### `options`

La méthode `options` est utilisée pour effectuer une requête OPTIONS. Elle accepte une URL et un objet de configuration optionnel en arguments et retourne une promise qui se résout vers l'objet de réponse.

```ts
axios.options(url: string, config?: AxiosRequestConfig<C>): AxiosResponse<R>;
```

### `post`

La méthode `post` est utilisée pour effectuer une requête POST. Elle accepte une URL, un objet de données optionnel et un objet de configuration optionnel en arguments et retourne une promise qui se résout vers l'objet de réponse.

```ts
axios.post(url: string, data?: D, config?: AxiosRequestConfig<C>): AxiosResponse<R>;
```

### `put`

La méthode `put` est utilisée pour effectuer une requête PUT. Elle accepte une URL, un objet de données optionnel et un objet de configuration optionnel en arguments et retourne une promise qui se résout vers l'objet de réponse.

```ts
axios.put(url: string, data?: D, config?: AxiosRequestConfig<C>): AxiosResponse<R>;
```

### `patch`

La méthode `patch` est utilisée pour effectuer une requête PATCH. Elle accepte une URL, un objet de données optionnel et un objet de configuration optionnel en arguments et retourne une promise qui se résout vers l'objet de réponse.

```ts
axios.patch(url: string, data?: D, config?: AxiosRequestConfig<C>): AxiosResponse<R>;
```

## Méthodes raccourcies pour les données de formulaire

Ces méthodes sont équivalentes à leurs homologues ci-dessus, mais prédéfinissent le `Content-Type` à `multipart/form-data`. Elles constituent la façon recommandée d'envoyer des fichiers ou de soumettre des formulaires HTML.

### `postForm`

```ts
axios.postForm(url: string, data?: D, config?: AxiosRequestConfig<C>): AxiosResponse<R>;
```

```js
// Envoyer un fichier depuis un input file du navigateur
await axios.postForm("/api/upload", {
  file: document.querySelector("#fileInput").files[0],
  description: "Profile photo",
});
```

### `putForm`

```ts
axios.putForm(url: string, data?: D, config?: AxiosRequestConfig<C>): AxiosResponse<R>;
```

```js
// Remplacer une ressource avec des données de formulaire
await axios.putForm("/api/users/1/avatar", {
  avatar: document.querySelector("#avatarInput").files[0],
});
```

### `patchForm`

```ts
axios.patchForm(url: string, data?: D, config?: AxiosRequestConfig<C>): AxiosResponse<R>;
```

```js
// Mettre à jour des champs spécifiques avec des données de formulaire
await axios.patchForm("/api/users/1", {
  displayName: "New Name",
  avatar: document.querySelector("#avatarInput").files[0],
});
```

::: tip
`postForm`, `putForm` et `patchForm` acceptent les mêmes types de données que leurs méthodes de base — objets simples, `FormData`, `FileList` et `HTMLFormElement`. Consultez [Envoi de fichiers](/pages/advanced/file-posting) pour plus d'exemples.
:::
