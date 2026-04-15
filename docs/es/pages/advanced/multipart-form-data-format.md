# Formato multipart-form-data

axios puede enviar solicitudes en el formato `multipart/form-data`. Este formato se usa comúnmente al subir archivos. Para enviar una solicitud en este formato, debes crear un objeto `FormData` y agregarle los datos. Luego puedes pasar el objeto `FormData` a la propiedad `data` de la configuración de solicitud de axios.

```js
const formData = new FormData();
formData.append('foo', 'bar');

axios.post('https://httpbin.org/post', formData);
```

En Node.js, puedes usar la librería `form-data` de la siguiente manera:

```js
const FormData = require('form-data');

const form = new FormData();
form.append('my_field', 'my value');
form.append('my_buffer', Buffer.alloc(10));
form.append('my_file', fs.createReadStream('/foo/bar.jpg'));

axios.post('https://example.com', form);
```

## Serialización automática a FormData <Badge type="tip" text="Nuevo" />

A partir de la versión v0.27.0, Axios admite la serialización automática de objetos a un objeto FormData si el encabezado `Content-Type` de la solicitud está establecido en `multipart/form-data`. Esto significa que puedes pasar un objeto JavaScript directamente a la propiedad `data` de la configuración de solicitud de axios. Por ejemplo, al pasar datos a una solicitud POST:

```js
import axios from 'axios';

axios
  .post(
    'https://httpbin.org/post',
    { x: 1 },
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  )
  .then(({ data }) => console.log(data));
```

En el entorno de Node.js, el polyfill ([`form-data`](https://github.com/form-data/form-data)) se usa de forma predeterminada. Puedes sobrescribir la clase FormData estableciendo la variable de configuración `env.FormData`, aunque en la mayoría de los casos no lo necesitarás:

```js
const axios = require('axios');
var FormData = require('form-data');

axios
  .post(
    'https://httpbin.org/post',
    { x: 1, buf: Buffer.alloc(10) },
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  )
  .then(({ data }) => console.log(data));
```

## Terminaciones admitidas

El serializador de FormData de Axios admite algunas terminaciones especiales para realizar las siguientes operaciones:

- `{}` - serializa el valor con JSON.stringify
- `[]` - desenvuelve el objeto tipo arreglo como campos separados con la misma clave

::: warning
Nota: la operación de desenvolvimiento/expansión se usará de forma predeterminada en arreglos y objetos FileList.
:::

## Configurar el serializador de FormData

El serializador de FormData admite opciones adicionales a través de la propiedad de objeto `config.formSerializer` para manejar casos especiales:

- `visitor: Function` - función de visitante definida por el usuario que se llamará de forma recursiva para serializar el objeto de datos a un objeto FormData siguiendo reglas personalizadas.
- `dots: boolean = false` - usa notación de punto en lugar de corchetes para serializar arreglos y objetos;
- `metaTokens: boolean = true` - añade la terminación especial (por ejemplo, `user{}: '{"name": "John"}'`) en la clave de FormData. El analizador de cuerpo del backend podría usar esta meta-información para analizar automáticamente el valor como JSON.
- `indexes: null|false|true = false` - controla cómo se añadirán los índices a las claves desenvueltas de objetos planos tipo arreglo:
  - `null` - no añadir corchetes (`arr: 1`, `arr: 2`, `arr: 3`)
  - `false` (predeterminado) - añadir corchetes vacíos (`arr[]: 1`, `arr[]: 2`, `arr[]: 3`)
  - `true` - añadir corchetes con índices (`arr[0]: 1`, `arr[1]: 2`, `arr[2]: 3`)
- `maxDepth: number = 100` - profundidad máxima de anidación de objetos en la que el serializador recursará. Si la entrada excede esta profundidad, se lanza un `AxiosError` con `code: 'ERR_FORM_DATA_DEPTH_EXCEEDED'`. Esto protege las aplicaciones del lado del servidor contra ataques DoS mediante cargas útiles profundamente anidadas. Establece en `Infinity` para desactivar el límite.

```js
// Aumentar el límite para esquemas que legítimamente exceden 100 niveles:
axios.post('/api', data, { formSerializer: { maxDepth: 200 } });
```

::: warning Nota de seguridad
El límite predeterminado de 100 es intencional. El código del lado del servidor que reenvía JSON controlado por el cliente a axios como `data` es vulnerable a un desbordamiento de pila de llamadas sin esta protección. Solo aumenta `maxDepth` si tu esquema realmente lo requiere.
:::

Por ejemplo, si tenemos un objeto como este:

```js
const obj = {
  x: 1,
  arr: [1, 2, 3],
  arr2: [1, [2], 3],
  users: [
    { name: 'Peter', surname: 'Griffin' },
    { name: 'Thomas', surname: 'Anderson' },
  ],
  'obj2{}': [{ x: 1 }],
};
```

El serializador de Axios ejecutará internamente los siguientes pasos:

```js
const formData = new FormData();
formData.append('x', '1');
formData.append('arr[]', '1');
formData.append('arr[]', '2');
formData.append('arr[]', '3');
formData.append('arr2[0]', '1');
formData.append('arr2[1][0]', '2');
formData.append('arr2[2]', '3');
formData.append('users[0][name]', 'Peter');
formData.append('users[0][surname]', 'Griffin');
formData.append('users[1][name]', 'Thomas');
formData.append('users[1][surname]', 'Anderson');
formData.append('obj2{}', '[{"x":1}]');
```

Axios admite los siguientes métodos abreviados: `postForm`, `putForm`, `patchForm`, que son simplemente los métodos HTTP correspondientes con el encabezado `Content-Type` preestablecido en `multipart/form-data`.
