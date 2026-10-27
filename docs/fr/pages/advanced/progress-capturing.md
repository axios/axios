# Capture de progression <Badge type="tip" text="Nouveau" />

Axios prend en charge la capture de la progression des envois et téléchargements dans les environnements navigateur et Node.js. La fréquence des événements de progression est limitée à 3 fois par seconde. Cela permet d'éviter de surcharger le navigateur avec des événements de progression. Voici un exemple de capture d'événements de progression :

```js
await axios.post(url, data, {
  onUploadProgress: function (axiosProgressEvent) {
    /*{
      loaded: number;
      total?: number;
      progress?: number; // dans la plage [0..1]
      bytes: number; // nombre d'octets transférés depuis le dernier déclenchement (delta)
      estimated?: number; // temps estimé en secondes
      rate?: number; // vitesse d'envoi en octets
      upload: true; // indicateur d'envoi
    }*/
  },

  onDownloadProgress: function (axiosProgressEvent) {
    /*{
      loaded: number;
      total?: number;
      progress?: number;
      bytes: number; 
      estimated?: number;
      rate?: number; // vitesse de téléchargement en octets
      download: true; // indicateur de téléchargement
    }*/
  },
});
```

Vous pouvez également transmettre les événements de progression d'envoi et de téléchargement vers un stream lisible dans Node.js. Cela est utile lorsque vous souhaitez afficher la progression de manière personnalisée. Voici un exemple de transmission des événements de progression :

```js
const { data } = await axios.post(SERVER_URL, readableStream, {
  onUploadProgress: ({ progress }) => {
    console.log((progress * 100).toFixed(2));
  },

  headers: {
    "Content-Length": contentLength,
  },

  maxRedirects: 0, // éviter de buffériser l'intégralité du stream
});
```

::: warning
La capture de la progression d'envoi de FormData n'est actuellement pas supportée dans les environnements Node.js
:::

::: danger
Il est recommandé de désactiver les redirections en définissant maxRedirects: 0 pour envoyer le stream dans l'environnement Node.js, car le package follow-redirects bufférisera l'intégralité du stream en RAM sans suivre l'algorithme de « backpressure »
:::

## Lire les données de réponse de manière incrémentale

Dans le navigateur, l'adaptateur XHR (celui par défaut) transmet l'événement de progression natif dans `axiosProgressEvent.event`. Vous pouvez utiliser sa propriété `target`, le `XMLHttpRequest` sous-jacent, pour lire le texte de réponse reçu jusqu'à présent :

```js
let received = 0;

await axios.get('/api/stream', {
  responseType: 'text',
  onDownloadProgress: ({ event }) => {
    const xhr = event.target;
    const chunk = xhr.responseText.slice(received);
    received = xhr.responseText.length;

    if (chunk) {
      console.log('new data:', chunk);
    }
  },
});
```

Comme les callbacks de progression sont limités en fréquence (throttling), une notification peut s'exécuter après que le navigateur a fini de distribuer l'événement d'origine. Dans ce cas, `event.currentTarget` vaut `null` (comportement DOM standard), mais `event.target` référence toujours la requête : utilisez donc `target` comme indiqué ci-dessus.

Lorsqu'un téléchargement XHR se termine avec succès, axios émet un dernier événement de progression de téléchargement depuis le gestionnaire `loadend` avec l'état complet du transfert, afin que le dernier fragment ne soit pas perdu à cause de la limitation de fréquence. La progression des envois, les téléchargements XHR échoués et les transferts abandonnés ou en erreur conservent leur comportement précédent : seul un événement de progression déjà en attente est transmis.
