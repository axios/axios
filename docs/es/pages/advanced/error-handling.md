# Manejo de errores

axios puede lanzar muchos tipos diferentes de errores. Algunos de estos errores son causados por el propio axios, mientras que otros son causados por el servidor o el cliente. La siguiente tabla lista la estructura general del error lanzado:

| Propiedad | Definición                                                                                                                                    |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| message   | Un resumen rápido del mensaje de error y el estado con el que falló.                                                                          |
| name      | Define el origen del error. Para axios, siempre será un `AxiosError`.                                                                         |
| stack     | Proporciona el seguimiento de la pila (stack trace) del error.                                                                                |
| config    | Un objeto de configuración de axios con configuraciones específicas de la instancia definidas por el usuario al momento de realizar la solicitud. |
| code      | Representa un error identificado por axios. La tabla a continuación lista definiciones específicas para errores internos de axios.             |
| status    | Código de estado HTTP de la respuesta. Consulta [aquí](https://en.wikipedia.org/wiki/List_of_HTTP_status_codes) para conocer los significados comunes de los códigos de estado HTTP. |

A continuación se lista una relación de posibles errores identificados por axios:

| Código                    | Definición                                                                                    |
| ------------------------- | --------------------------------------------------------------------------------------------- |
| ERR_BAD_OPTION_VALUE      | Valor inválido o no compatible proporcionado en la configuración de axios.                    |
| ERR_BAD_OPTION            | Opción inválida proporcionada en la configuración de axios.                                   |
| ECONNABORTED              | Generalmente indica que la solicitud ha expirado (salvo que `transitional.clarifyTimeoutError` esté activado) o fue abortada por el navegador o un complemento del mismo. |
| ETIMEDOUT                 | La solicitud expiró al superar el límite de tiempo predeterminado de axios. Se debe activar `transitional.clarifyTimeoutError` en `true`, de lo contrario se lanzará un error genérico `ECONNABORTED`. |
| ERR_NETWORK               | Problema relacionado con la red. En el navegador, este error también puede ser causado por una violación de la política [CORS](https://developer.mozilla.org/ru/docs/Web/HTTP/Guides/CORS) o [Mixed Content](https://developer.mozilla.org/en-US/docs/Web/Security/Mixed_content). El navegador no permite que el código JS aclare la razón real del error por motivos de seguridad; por eso, revisa la consola. |
| ERR_FR_TOO_MANY_REDIRECTS | La solicitud fue redirigida demasiadas veces; supera el número máximo de redirecciones especificado en la configuración de axios. |
| ERR_DEPRECATED            | Se usó una característica o método obsoleto en axios.                                         |
| ERR_BAD_RESPONSE          | La respuesta no puede ser analizada correctamente o tiene un formato inesperado. Generalmente relacionado con una respuesta con código de estado `5xx`. |
| ERR_BAD_REQUEST           | La solicitud tiene un formato inesperado o le faltan parámetros requeridos. Generalmente relacionado con una respuesta con código de estado `4xx`. |
| ERR_CANCELED              | La característica o método fue cancelado explícitamente por el usuario usando un AbortSignal (o un CancelToken). |
| ERR_NOT_SUPPORT           | Característica o método no compatible en el entorno actual de axios.                          |
| ERR_INVALID_URL           | URL inválida proporcionada para la solicitud de axios.                                        |

## Manejo de errores

El comportamiento predeterminado de axios es rechazar la Promise si la solicitud falla. Sin embargo, también puedes capturar el error y manejarlo según lo consideres apropiado. A continuación se muestra un ejemplo de cómo capturar un error:

```js
axios.get("/user/12345").catch(function (error) {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.log(error.response.data);
    console.log(error.response.status);
    console.log(error.response.headers);
  } else if (error.request) {
    // The request was made but no response was received
    // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
    // http.ClientRequest in node.js
    console.log(error.request);
  } else {
    // Something happened in setting up the request that triggered an Error
    console.log("Error", error.message);
  }
  console.log(error.config);
});
```

Usando la opción de configuración `validateStatus`, puedes sobreescribir la condición predeterminada (status >= 200 && status < 300) y definir los códigos HTTP que deben lanzar un error.

```js
axios.get("/user/12345", {
  validateStatus: function (status) {
    return status < 500; // Resolve only if the status code is less than 500
  },
});
```

Usando el método `toJSON`, puedes obtener un objeto con más información sobre el error.

```js
axios.get("/user/12345").catch(function (error) {
  console.log(error.toJSON());
});
```
