# Primeros pasos

¡Bienvenido a la documentación de axios! Esta guía te ayudará a comenzar con axios y a realizar tu primera solicitud a una API. Si eres nuevo en axios, te recomendamos empezar aquí.

## Instalación

Puedes usar axios en tu proyecto de varias formas. La más común es instalarlo desde npm e incluirlo en tu proyecto. También ofrecemos soporte para jsDelivr, unpkg y más.

#### Usando npm

```bash
npm install axios
```

#### Usando pnpm

```bash
pnpm install axios
```

#### Usando yarn

```bash
yarn add axios
```

#### Usando bun

```bash
bun add axios
```

#### Usando deno

```bash
deno install npm:axios
```

#### Usando jsDelivr

Al usar jsDelivr, recomendamos utilizar la versión minificada y fijar el número de versión para evitar cambios inesperados. Si deseas usar la última versión, puedes hacerlo omitiendo el número de versión. Esto está fuertemente desaconsejado para uso en producción, ya que puede ocasionar cambios inesperados en tu aplicación.

```html
<script src="https://cdn.jsdelivr.net/npm/axios@<x.x.x>/dist/axios.min.js"></script>
```

#### Usando unpkg

Al usar unpkg, recomendamos utilizar la versión minificada y fijar el número de versión para evitar cambios inesperados. Si deseas usar la última versión, puedes hacerlo omitiendo el número de versión. Esto está fuertemente desaconsejado para uso en producción, ya que puede ocasionar cambios inesperados en tu aplicación.

```html
<script src="https://unpkg.com/axios@<x.x.x>/dist/axios.min.js"></script>
```

## Tu primera solicitud

Una solicitud con axios puede realizarse en tan solo dos líneas de código. Hacer tu primera solicitud con axios es muy sencillo. Puedes hacer una solicitud a cualquier API indicando la URL y el método. Por ejemplo, para hacer una solicitud GET a la API de JSONPlaceholder, puedes usar el siguiente código:

```js
import axios from "axios";

const response = await axios.get(
  "https://jsonplaceholder.typicode.com/posts/1"
);

console.log(response.data);
```

axios ofrece una API sencilla para realizar solicitudes. Puedes usar el método `axios.get` para hacer una solicitud GET, el método `axios.post` para hacer una solicitud POST, y así sucesivamente. También puedes usar el método `axios.request` para hacer una solicitud con cualquier método.

## Próximos pasos

Ahora que has realizado tu primera solicitud con axios, estás listo para explorar el resto de la documentación. Puedes aprender más sobre cómo hacer solicitudes, manejar respuestas y usar axios en tus proyectos. Consulta el resto de la documentación para saber más.
