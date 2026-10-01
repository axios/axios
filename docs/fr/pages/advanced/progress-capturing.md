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
