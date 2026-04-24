# HTTP2 <Badge type="warning" text="Expérimental" /> <Badge type="tip" text="v1.13.0+" />

Le support expérimental de HTTP/2 a été ajouté à l'adaptateur `http` dans la version `1.13.0`. Il est disponible uniquement dans les environnements Node.js.

## Utilisation de base

Utilisez l'option `httpVersion` pour sélectionner la version du protocole pour une requête. En la définissant à `2`, vous activez HTTP/2.

```js
const { data, headers, status } = await axios.post(
  "https://httpbin.org/post",
  form,
  {
    httpVersion: 2,
  },
);
```

## `http2Options`

Des options natives supplémentaires pour l'appel interne `session.request()` peuvent être passées via l'objet de configuration `http2Options`. Cela inclut également le paramètre personnalisé `sessionTimeout`, qui contrôle la durée (en millisecondes) pendant laquelle une session HTTP/2 inactive est maintenue avant d'être fermée. La valeur par défaut est `1000ms`.

```js
{
  httpVersion: 2,
  http2Options: {
    rejectUnauthorized: false, // accepter les certificats auto-signés (développement uniquement)
    sessionTimeout: 5000,      // maintenir la session inactive pendant 5 secondes
  },
}
```

::: warning
Le support HTTP/2 est actuellement expérimental. L'API peut changer dans les prochaines versions mineures ou de correctifs.
:::

## Exemple complet

L'exemple ci-dessous envoie une requête POST `multipart/form-data` via HTTP/2 et suit à la fois la progression de l'envoi et du téléchargement.

```js
const form = new FormData();
form.append("foo", "123");

const { data, headers, status } = await axios.post(
  "https://httpbin.org/post",
  form,
  {
    httpVersion: 2,
    http2Options: {
      // rejectUnauthorized: false,
      // sessionTimeout: 1000
    },
    onUploadProgress(e) {
      console.log("upload progress", e);
    },
    onDownloadProgress(e) {
      console.log("download progress", e);
    },
    responseType: "arraybuffer",
  },
);
```

## Référence de configuration

| Option | Type | Défaut | Description |
|---|---|---|---|
| `httpVersion` | `number` | `1` | Version du protocole HTTP à utiliser. Définissez à `2` pour activer HTTP/2. |
| `http2Options.sessionTimeout` | `number` | `1000` | Durée en millisecondes avant qu'une session HTTP/2 inactive soit fermée. |

Toutes les autres options natives de `session.request()` supportées par le module `http2` intégré de Node.js peuvent également être passées dans `http2Options`.
