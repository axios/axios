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

::: warning Les redirections ne sont pas supportées via HTTP/2
L'adaptateur HTTP/2 ne suit actuellement pas les redirections. Si une requête émise avec `httpVersion: 2` reçoit une réponse `3xx`, la redirection n'est pas suivie automatiquement. Gérez ces réponses manuellement ou restez sur HTTP/1.x pour les endpoints qui s'appuient sur les redirections.
:::

## Résolution DNS personnalisée

Une fonction [`lookup`](https://nodejs.org/api/dns.html#dnslookuphostname-options-callback) personnalisée s'applique également aux connexions HTTP/2. La fonction de résolution fait partie des options de session : les requêtes ne réutilisent donc une session que lorsqu'elles utilisent la même fonction `lookup`.

```js
import dns from 'node:dns';

const { data } = await axios.get('https://example.com/api', {
  httpVersion: 2,
  lookup: (hostname, options, callback) => {
    // Résolvez avec votre propre logique, puis renvoyez le résultat à Node.js
    dns.lookup(hostname, options, callback);
  },
});
```

## Proxys

Les requêtes HTTP/2 ne peuvent pas être envoyées via un proxy, car `http2.connect()` de Node.js ne peut pas appliquer les paramètres de proxy :

- Un objet `proxy` explicite est rejeté avec une `AxiosError` dont le code est `ERR_NOT_SUPPORT`.
- `proxy: false` se connecte directement, comme auparavant.
- Les variables d'environnement de proxy (`HTTP_PROXY`, `HTTPS_PROXY`, etc.) et les paramètres `proxyEnv` de `httpAgent`/`httpsAgent` sont ignorés.

::: danger Les requêtes HTTP/2 contournent les proxys d'environnement
Comme les paramètres de proxy de l'environnement sont ignorés, une requête HTTP/2 se connecte directement à l'origine même lorsque le processus est configuré pour utiliser un proxy. Si votre déploiement exige que tout le trafic sortant passe par un proxy, n'utilisez pas `httpVersion: 2`.
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
