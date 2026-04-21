# Valores predeterminados de configuración

axios te permite especificar valores predeterminados de configuración que se aplicarán a cada solicitud. Puedes definir valores predeterminados para `baseURL`, `headers`, `timeout` y otras propiedades. A continuación se muestra un ejemplo de cómo usar los valores predeterminados de configuración:

```js
axios.defaults.baseURL = "https://jsonplaceholder.typicode.com/posts";
axios.defaults.headers.common["Authorization"] = AUTH_TOKEN;
axios.defaults.headers.post["Content-Type"] =
  "application/x-www-form-urlencoded";
```

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
