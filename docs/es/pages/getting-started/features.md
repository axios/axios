# Características

axios es un potente cliente HTTP que proporciona una API simple y fácil de usar para realizar solicitudes HTTP. Es compatible con todos los navegadores modernos y es ampliamente utilizado en la comunidad JavaScript. A continuación se presentan algunas de las características que hacen de axios una excelente opción para tu próximo proyecto.

## Isomórfico

axios es un cliente HTTP universal que puede usarse tanto en el navegador como en Node.js. Esto significa que puedes utilizar axios para hacer solicitudes a APIs desde tu código frontend y también desde tu código backend. Esto convierte a axios en una gran opción para construir progressive web apps, aplicaciones de una sola página (SPA) y aplicaciones con renderizado del lado del servidor.

axios también es una excelente opción para equipos que trabajan tanto en frontend como en backend. Al usar axios en ambos lados, puedes contar con una API consistente para realizar solicitudes HTTP, lo que ayuda a reducir la complejidad de tu base de código.

## Soporte para Fetch <Badge type="tip" text="Nuevo" />

axios ofrece soporte de primera clase para la Fetch API, que es un reemplazo moderno de la API XHR. El adaptador es opcional y puede habilitarse mediante configuración. Se mantiene la misma API tanto para el adaptador XHR como para el adaptador Fetch, lo que facilita adoptar la Fetch API en tu base de código sin necesidad de modificar el código existente.

## Soporte de navegadores

axios es compatible con todos los navegadores modernos y algunos más antiguos, incluyendo Chrome, Firefox, Safari y Edge. axios es una excelente opción para construir aplicaciones web que necesiten soportar una amplia variedad de navegadores.

## Soporte de Node.js

axios también es compatible con una amplia gama de versiones de Node.js, con compatibilidad probada hasta la versión v12.x, lo que lo convierte en una buena opción en entornos donde actualizar a la última versión de Node.js puede no ser posible o práctico.

Además de Node.js, axios cuenta con pruebas de humo para Bun y Deno que validan comportamientos clave en tiempo de ejecución y mejoran la confianza en la compatibilidad entre distintos entornos.

## Características adicionales

- Compatible con la API de Promise
- Interceptar solicitudes y respuestas
- Transformar datos de solicitudes y respuestas
- Controlador de cancelación (Abort controller)
- Tiempos de espera (timeouts)
- Serialización de parámetros de consulta con soporte para entradas anidadas
- Serialización automática del cuerpo de la solicitud a:
  - JSON (application/json)
  - Multipart / FormData (multipart/form-data)
  - Formulario codificado en URL (application/x-www-form-urlencoded)
- Envío de formularios HTML como JSON
- Manejo automático de datos JSON en la respuesta
- Captura de progreso para navegadores y Node.js con información adicional (velocidad de transferencia, tiempo restante)
- Configuración de límites de ancho de banda para Node.js
- Compatible con FormData y Blob conformes a la especificación (incluyendo Node.js)
- Soporte del lado del cliente para protección contra XSRF
