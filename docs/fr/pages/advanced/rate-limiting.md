# Limitation de débit <Badge type="tip" text="Nouveau" />

axios prend en charge la limitation de bande passante dans l'environnement Node.js via l'adaptateur HTTP. Cela vous permet de plafonner la vitesse d'envoi ou de téléchargement des données, ce qui est utile pour les opérations en masse, les tâches en arrière-plan ou le scraping respectueux qui ne doit pas saturer une connexion.

## `maxRate`

L'option `maxRate` accepte soit un nombre (octets par seconde) soit un tableau où la première valeur est la limite d'envoi et la deuxième valeur est la limite de téléchargement. Utilisez `[uploadRate]` pour limiter uniquement l'envoi, ou `[uploadRate, downloadRate]` pour limiter les deux sens. Lorsqu'un nombre unique est passé, la même limite s'applique à l'envoi et au téléchargement.

```js
// Limiter l'envoi et le téléchargement à 100 Ko/s
await axios.get(URL, { maxRate: 100 * 1024 });

// Limiter l'envoi à 100 Ko/s, le téléchargement à 500 Ko/s
await axios.get(URL, { maxRate: [100 * 1024, 500 * 1024] });
```

::: warning
`maxRate` n'est supporté que par l'adaptateur HTTP Node.js. Il n'a aucun effet dans les environnements navigateur.
:::

## Limitation du débit d'envoi

Plafonnez la vitesse d'envoi tout en journalisant la progression en même temps :

```js
const { data } = await axios.post(SERVER_URL, myBuffer, {
  onUploadProgress: ({ progress, rate }) => {
    const percent = (progress * 100).toFixed(1);
    const kbps = (rate / 1024).toFixed(1);
    console.log(`Upload [${percent}%] at ${kbps} KB/s`);
  },

  maxRate: [100 * 1024], // plafonner l'envoi à 100 Ko/s
});
```

## Limitation du débit de téléchargement

Plafonnez la vitesse de téléchargement pour les réponses volumineuses :

```js
const { data } = await axios.get(FILE_URL, {
  onDownloadProgress: ({ progress, rate }) => {
    const percent = (progress * 100).toFixed(1);
    const kbps = (rate / 1024).toFixed(1);
    console.log(`Download [${percent}%] at ${kbps} KB/s`);
  },

  maxRate: [Infinity, 200 * 1024], // pas de limite d'envoi, 200 Ko/s en téléchargement
  responseType: "arraybuffer",
});
```

## Limitation combinée envoi et téléchargement

Passez les deux limites sous forme de tableau pour contrôler les deux sens simultanément :

```js
await axios.post(SERVER_URL, largeBuffer, {
  maxRate: [50 * 1024, 500 * 1024], // 50 Ko/s en envoi, 500 Ko/s en téléchargement
});
```
