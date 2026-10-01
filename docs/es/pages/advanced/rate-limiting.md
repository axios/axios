# Limitación de velocidad <Badge type="tip" text="Nuevo" />

axios admite la limitación del ancho de banda en el entorno Node.js a través del adaptador HTTP. Esto te permite controlar la velocidad de carga o descarga de datos, lo que es útil para operaciones masivas, trabajos en segundo plano o scraping educado que no debe saturar una conexión.

## `maxRate`

La opción `maxRate` acepta un número (bytes por segundo) o un arreglo donde el primer valor es el límite de carga y el segundo es el límite de descarga. Usa `[uploadRate]` para limitar solo la carga, o `[uploadRate, downloadRate]` para limitar ambas direcciones. Cuando se pasa un número único, el mismo límite se aplica tanto a la carga como a la descarga.

```js
// Limit both upload and download to 100 KB/s
await axios.get(URL, { maxRate: 100 * 1024 });

// Limit upload to 100 KB/s, download to 500 KB/s
await axios.get(URL, { maxRate: [100 * 1024, 500 * 1024] });
```

::: warning
`maxRate` solo es compatible con el adaptador HTTP de Node.js. No tiene efecto en entornos de navegador.
:::

## Limitación de velocidad de carga

Limita la velocidad de carga y registra el progreso al mismo tiempo:

```js
const { data } = await axios.post(SERVER_URL, myBuffer, {
  onUploadProgress: ({ progress, rate }) => {
    const percent = (progress * 100).toFixed(1);
    const kbps = (rate / 1024).toFixed(1);
    console.log(`Upload [${percent}%] at ${kbps} KB/s`);
  },

  maxRate: [100 * 1024], // cap upload at 100 KB/s
});
```

## Limitación de velocidad de descarga

Limita la velocidad de descarga para respuestas de gran tamaño:

```js
const { data } = await axios.get(FILE_URL, {
  onDownloadProgress: ({ progress, rate }) => {
    const percent = (progress * 100).toFixed(1);
    const kbps = (rate / 1024).toFixed(1);
    console.log(`Download [${percent}%] at ${kbps} KB/s`);
  },

  maxRate: [Infinity, 200 * 1024], // no upload limit, 200 KB/s download limit
  responseType: "arraybuffer",
});
```

## Limitación combinada de carga y descarga

Pasa ambos límites como un arreglo para controlar ambas direcciones simultáneamente:

```js
await axios.post(SERVER_URL, largeBuffer, {
  maxRate: [50 * 1024, 500 * 1024], // 50 KB/s up, 500 KB/s down
});
```
