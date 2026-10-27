# Guide de migration

Ce guide a pour but de vous aider à migrer votre projet d'une version du framework à une autre. Il est recommandé de lire les notes de version de chaque version majeure que vous migrez, car elles peuvent contenir des informations importantes sur les changements incompatibles.

## Migration vers v1.21.0

### Instances de classes personnalisées comme valeurs par défaut des en-têtes

Sous `headers.common` et les clés de méthode telles que `headers.post`, axios ne traite désormais comme groupes de valeurs par défaut que les objets simples, les objets à prototype nul et les instances d'`AxiosHeaders`, afin que les en-têtes littéraux portant le nom d'une méthode, comme `Link`, soient préservés. Si vous affectez une instance de votre propre classe comme groupe, convertissez-la en objet simple (`{ post: { ...customDefaults } }`) ou en `new AxiosHeaders({ ...customDefaults })`. Sinon, sa représentation sous forme de chaîne est envoyée comme en-tête littéral à chaque requête, y compris les requêtes utilisant d'autres méthodes, ce qui peut exposer le contenu inclus par une méthode `toString()` personnalisée. Consultez [Valeurs par défaut des en-têtes par méthode](/fr/pages/advanced/config-defaults#valeurs-par-defaut-des-en-tetes-par-methode).

## Migration vers v1.20.0

### Le fetch personnalisé reçoit un second argument filtré

Lorsqu'un constructeur `Request` est disponible, un `env.fetch` personnalisé reçoit toujours `fetchOptions` comme second argument, mais sans `method`, `headers`, `body`, `signal`, `duplex` et `credentials`. Ces valeurs sont représentées par la `Request` résolue passée comme premier argument, et leur omission empêche le second argument de la remplacer. Les implémentations de fetch personnalisées qui lisent ces champs depuis le second argument doivent désormais les lire depuis la `Request`. Consultez [Arguments passés à un fetch personnalisé](/fr/pages/advanced/fetch-adapter#arguments-passes-a-un-fetch-personnalise).

### Adaptateur fetch et `maxRedirects: 0`

L'adaptateur fetch associe `maxRedirects: 0` au mode de redirection manuel de la plateforme au lieu de suivre les redirections. Dans Node.js, la réponse `3xx` et son en-tête `Location` peuvent être visibles ; les navigateurs retournent une redirection opaque avec le statut `0` et des en-têtes illisibles. Les valeurs positives ne limitent toujours pas le nombre de redirections dans l'adaptateur fetch. Consultez [Redirections de l'adaptateur fetch](/fr/pages/advanced/fetch-adapter#redirections).

### HTTP/2 et proxys

Les requêtes avec `httpVersion: 2` et un objet `proxy` explicite sont rejetées avec `ERR_NOT_SUPPORT`. Les requêtes HTTP/2 ignorent les variables d'environnement de proxy et les paramètres `proxyEnv` des agents et se connectent directement : n'utilisez donc pas HTTP/2 lorsque le passage par un proxy est une politique de sortie obligatoire. `proxy: false` continue de se connecter directement. Consultez [Proxys HTTP2](/fr/pages/advanced/http2#proxys).

### Configurations de remplacement retournées par les intercepteurs de requête

Lorsqu'un intercepteur de requête retourne un objet qui n'est pas un objet modifiable à prototype nul, comme un littéral d'objet, une copie `{ ...config }` ou une instance de classe, axios le copie dans un instantané filtré à prototype nul avant l'envoi. Les champs hérités d'un prototype défini par l'application sont copiés comme champs propres, mais l'instantané ne préserve ni l'identité de l'objet, ni son prototype, ni les vérifications `instanceof`, ni les accesseurs, ni les attributs de propriété. Les champs hérités via un prototype dont le propre prototype est `null`, comme un modèle `Object.create(null)`, sont ignorés. Retourner la configuration d'origine, ou un autre objet modifiable à prototype nul sans clé dangereuse, conserve son identité, et axios met à jour des champs comme `headers` et `data` sur cet objet pendant l'envoi. Consultez [Retourner un autre objet de configuration](/fr/pages/advanced/interceptors#retourner-un-autre-objet-de-configuration).

### Noms de codes de statut de la RFC 9110

`HttpStatusCode.ContentTooLarge` (413) et `HttpStatusCode.UnprocessableContent` (422) sont les noms à privilégier. `PayloadTooLarge` et `UnprocessableEntity` restent disponibles en tant qu'alias dépréciés tout au long de la v1.x, et les recherches inverses numériques retournent toujours les noms historiques.

## Migration vers v1.19.0

### Les URL HTTP(S) mal formées sont rejetées

Les requêtes rejettent désormais une `url` ou une `baseURL` `http:` ou `https:` qui omet `//` après le protocole. Remplacez les valeurs telles que `https:example.com` ou `https:/example.com` par une URL bien formée comme `https://example.com`. L'`AxiosError` résultante utilise le code `ERR_INVALID_URL` et identifie l'URL concernée après masquage sécurisé des secrets. Ce changement de sécurité intentionnel empêche la normalisation des URL mal formées de contourner `baseURL` ou les listes d'URL autorisées.

### Erreurs des intercepteurs de requête synchrones

Lorsqu'un intercepteur de requête synchrone lève une erreur, axios appelle son gestionnaire de rejet associé et arrête les intercepteurs de requête restants. Un gestionnaire de rejet qui retourne normalement traite l'erreur comme résolue et envoie la requête avec la dernière configuration valide ; sa valeur de retour ne devient pas la configuration. Si une validation doit empêcher l'envoi, omettez le gestionnaire de rejet ou faites-lui lever une erreur ou retourner une Promise rejetée. Les erreurs terminales continuent à travers les intercepteurs de rejet de réponse.

## Migration de v0.x vers v1.x

### Modification de l'instruction d'importation

Dans v1.x, l'instruction d'importation a été modifiée pour utiliser l'export `default`. Vous devrez donc mettre à jour vos instructions d'importation en conséquence.

```diff
- import { axios } from "axios";
+ import axios from "axios";
```

### Modifications du système d'intercepteurs

Dans v1.x, vous devez utiliser le type `InternalAxiosRequestConfig` pour typer le paramètre `config` dans l'intercepteur de `request`. En effet, le paramètre `config` est désormais typé comme `InternalAxiosRequestConfig` au lieu du type public `AxiosRequestConfig`.

```diff
- axios.interceptors.request.use((config: AxiosRequestConfig) => {
+ axios.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    return config;
  });
```

### Modifications de la structure des en-têtes de requête

Dans v1.x, la structure des en-têtes de requête a été modifiée pour supprimer la propriété `common`. Vous devrez donc mettre à jour votre code pour utiliser la nouvelle structure des en-têtes de requête comme suit :

```diff
- if (request.headers?.common?.Authorization) {
-       request.headers.common.Authorization = ...
+ if (request.headers?.Authorization) {
+       request.headers.Authorization = ...
```

Les en-têtes par défaut qui se trouvaient précédemment sous `common`, `get`, `post`, etc. sont désormais définis directement sur `axios.defaults.headers` :

```diff
- axios.defaults.headers.common["Accept"] = "application/json";
+ axios.defaults.headers["Accept"] = "application/json";
```

### Données multipart/form-data

Si une requête inclut un payload `FormData`, l'en-tête `Content-Type: multipart/form-data` est désormais défini automatiquement. Supprimez tout en-tête manuel pour éviter les doublons :

```diff
- axios.post("/upload", formData, {
-   headers: { "Content-Type": "multipart/form-data" },
- });
+ axios.post("/upload", formData);
```

Si vous définissez explicitement `Content-Type: application/json`, axios sérialisera désormais automatiquement les données en JSON.

### Sérialisation des paramètres

v1.x a introduit plusieurs changements incompatibles dans la façon dont les paramètres d'URL sont sérialisés. Les plus importants :

**Les `params` sont désormais encodés en pourcentage par défaut.** Si votre backend attendait des crochets bruts issus de l'encodage de style qs, vous devrez peut-être configurer un sérialiseur personnalisé :

```js
import qs from 'qs';

axios.create({
  paramsSerializer: {
    serialize: (params) => qs.stringify(params, { arrayFormat: 'brackets' }),
  },
});
```

**Les objets imbriqués dans `params` sont désormais sérialisés avec la notation entre crochets** (`foo[bar]=1`) plutôt que la notation pointée. Si votre backend attendait la notation pointée, utilisez un sérialiseur personnalisé.

**Les paramètres `null` et `undefined`** sont désormais gérés de manière cohérente : les valeurs `null` sont sérialisées comme des chaînes vides, tandis que les valeurs `undefined` sont entièrement omises.

Pour les options complètes de configuration de la sérialisation des paramètres, consultez la page [Configuration de requête](/pages/advanced/request-config).

### Les éléments internes ne sont plus exportés

Nous avons décidé de ne plus exporter les éléments internes d'axios. Vous devrez donc mettre à jour votre code pour n'utiliser que l'API publique d'axios. Cette modification a été apportée pour simplifier l'API et réduire la surface exposée d'axios, nous permettant ainsi d'effectuer des modifications internes sans les déclarer comme des changements incompatibles.

Veuillez consulter la [référence API](/pages/advanced/api-reference) sur ce site pour obtenir les dernières informations sur l'API publique d'axios.

### Configuration de requête

Nous avons apporté des modifications à l'objet de configuration de requête. Veuillez consulter la [référence de configuration](/pages/advanced/request-config) sur ce site pour obtenir les dernières informations.

### Changements incompatibles non répertoriés

Ce guide n'est pas exhaustif et peut ne pas couvrir tous les changements incompatibles. Si vous rencontrez un problème, veuillez ouvrir un ticket sur le [dépôt GitHub de la documentation](https://github.com/axios/docs) avec le label `breaking change`.
