# Valores predeterminados de configuración

axios te permite especificar valores predeterminados de configuración que se aplicarán a cada solicitud. Puedes definir valores predeterminados para `baseURL`, `headers`, `timeout` y otras propiedades. A continuación se muestra un ejemplo de cómo usar los valores predeterminados de configuración:

```js
axios.defaults.baseURL = "https://jsonplaceholder.typicode.com/posts";
axios.defaults.headers.common["Authorization"] = AUTH_TOKEN;
axios.defaults.headers.post["Content-Type"] =
  "application/x-www-form-urlencoded";
```

::: warning Los encabezados globales se envían a todos los hosts
Si tu aplicación se comunica con más de un dominio, establecer `axios.defaults.headers.common["Authorization"]` enviará el token a **todos** ellos, incluidas APIs de terceros que tal vez no controles. Usa una [instancia personalizada](#valores-predeterminados-personalizados-por-instancia) con un `baseURL` acotado para cualquier cliente que transporte credenciales.
:::

## Valores predeterminados de encabezados por método

`headers.common` se aplica a todas las solicitudes, y `headers.get`, `headers.post` y los demás nombres de método en minúsculas se aplican solo a las solicitudes con ese método. Estos grupos de valores predeterminados deben ser objetos planos, objetos con prototipo nulo o instancias de `AxiosHeaders`. Cualquier otro valor bajo una de estas claves se trata como un valor de encabezado literal; consulta [Encabezados con nombres de métodos HTTP](/es/pages/advanced/headers#encabezados-con-nombres-de-metodos-http).

Si construyes los valores predeterminados con tu propia clase, convierte la instancia antes de asignarla como grupo:

```js
import axios, { AxiosHeaders } from 'axios';

const instance = axios.create({
  headers: {
    // Ambas opciones conservan las entradas de encabezado propias y enumerables de la instancia como valores predeterminados de POST
    post: { ...customDefaults },
    // o bien: post: new AxiosHeaders({ ...customDefaults }),
  },
});
```

::: warning
Una instancia de clase arbitraria asignada bajo `common` o un nombre de método no se usa como grupo. Su representación como cadena se envía como un encabezado literal (por ejemplo, `post: [object Object]`) en cada solicitud, incluidas las solicitudes con otros métodos. Un `toString()` personalizado puede exponer de esta forma el contenido de la instancia.
:::

## Valores predeterminados personalizados por instancia

Las instancias de axios se declaran con sus propios valores predeterminados al ser creadas. Estos valores pueden sobreescribirse estableciendo la propiedad `defaults` en la instancia. A continuación se muestra un ejemplo de cómo usar valores predeterminados personalizados por instancia:

```js
var instance = axios.create({
  baseURL: "https://jsonplaceholder.typicode.com/posts",
  timeout: 1000,
  headers: { Authorization: "foobar" },
});

instance.defaults.headers.common["Authorization"] = AUTH_TOKEN;
```

## Orden de precedencia de la configuración

La configuración se combinará con un orden de precedencia. El orden es el siguiente: primero se establecen los valores predeterminados de la librería, luego las propiedades predeterminadas de la instancia y, finalmente, el argumento de configuración de la solicitud. A continuación se muestra un ejemplo del orden de precedencia.

Algunas opciones son específicas de cada solicitud y solo se toman de la configuración de la solicitud. `data` es una de ellas: axios no hereda ni fusiona en profundidad cuerpos de solicitud desde los valores predeterminados globales o de instancia. Si todas las solicitudes necesitan campos compartidos en el cuerpo, agrégalos con un interceptor de solicitud o `transformRequest`, y limita cuidadosamente ese comportamiento para no enviar valores sensibles al endpoint equivocado.

Primero, vamos a crear una instancia con los valores predeterminados que proporciona la librería. En este punto, el valor de configuración de timeout es `0`, que es el valor predeterminado de la librería.

```js
const instance = axios.create();
```

Ahora sobreescribiremos el timeout predeterminado de la instancia a `2500` milisegundos. A partir de ahora, todas las solicitudes que usen esta instancia esperarán 2.5 segundos antes de expirar.

```js
instance.defaults.timeout = 2500;
```

Finalmente, haremos una solicitud con un timeout de `5000` milisegundos. Esta solicitud esperará 5 segundos antes de expirar.

```js
instance.get("/longRequest", {
  timeout: 5000,
});
```
