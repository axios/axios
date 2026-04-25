# Publicación de archivos

axios facilita la subida de archivos. Usa `postForm` o `FormData` cuando necesites subidas en formato `multipart/form-data`.

## Archivo único (navegador)

Pasa un objeto `File` directamente como valor de campo — axios lo detectará y usará automáticamente el tipo de contenido correcto:

```js
await axios.postForm("https://httpbin.org/post", {
  description: "My profile photo",
  file: document.querySelector("#fileInput").files[0],
});
```

## Múltiples archivos (navegador)

Pasa un `FileList` para subir todos los archivos seleccionados a la vez. Todos se enviarán bajo el mismo nombre de campo (`files[]`):

```js
await axios.postForm(
  "https://httpbin.org/post",
  document.querySelector("#fileInput").files
);
```

Para usar nombres de campo distintos para cada archivo, construye un objeto `FormData` manualmente:

```js
const formData = new FormData();
formData.append("avatar", avatarFile);
formData.append("cover", coverFile);

await axios.post("https://httpbin.org/post", formData);
```

## Seguimiento del progreso de la carga (navegador)

Usa el callback `onUploadProgress` para mostrar una barra de progreso o un porcentaje a tus usuarios:

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

Consulta [Captura de progreso](/pages/advanced/progress-capturing) para ver la lista completa de campos disponibles en el evento de progreso.

## Archivos en Node.js

En Node.js, usa `fs.createReadStream` para subir un archivo desde el sistema de archivos sin cargarlo completamente en memoria:

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
El paquete npm `form-data` es necesario en entornos Node.js para crear objetos `FormData`. En versiones modernas de Node.js (v18+), el `FormData` global está disponible de forma nativa.
:::

## Subir un Buffer (Node.js)

También puedes subir un `Buffer` en memoria directamente:

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
La captura del progreso de carga de `FormData` no está disponible actualmente en entornos Node.js.
:::

::: danger
Al subir un stream legible en Node.js, establece `maxRedirects: 0` para evitar que el paquete `follow-redirects` almacene todo el stream en memoria RAM.
:::
