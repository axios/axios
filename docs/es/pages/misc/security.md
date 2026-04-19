# Política de seguridad

## ⚠️ Bomba de descompresión / almacenamiento de respuesta sin límites

Por defecto, `maxContentLength` y `maxBodyLength` están configurados en `-1` (sin límite). Un servidor malicioso o comprometido puede devolver un cuerpo pequeño comprimido con gzip/deflate/brotli que se expande a gigabytes, agotando la memoria del proceso Node.js.

**Si realizas solicitudes a servidores en los que no confías plenamente, DEBES establecer un `maxContentLength` (y `maxBodyLength`) adecuado para tu carga de trabajo.** El límite se aplica chunk a chunk durante la descompresión en flujo, así que basta con configurarlo para neutralizar ataques de bomba de descompresión.

```js
axios.get('https://example.com/data', {
  maxContentLength: 10 * 1024 * 1024, // 10 MB
  maxBodyLength: 10 * 1024 * 1024,
});

// O globalmente:
axios.defaults.maxContentLength = 10 * 1024 * 1024;
axios.defaults.maxBodyLength = 10 * 1024 * 1024;
```

El valor por defecto no se ha endurecido porque hacerlo romperá silenciosamente cualquier descarga legítima mayor al límite elegido. La responsabilidad de escoger un tope seguro para fuentes no confiables recae en la aplicación.

## Reportar una vulnerabilidad

Si crees haber encontrado una vulnerabilidad de seguridad en el proyecto, por favor repórtanosla como se describe a continuación. Tomamos todas las vulnerabilidades de seguridad con seriedad. Si has encontrado una vulnerabilidad en una librería de terceros, por favor repórtala a los responsables de esa librería.

## Proceso de reporte

Por favor, no reportes vulnerabilidades de seguridad a través de los issues públicos de GitHub. Usa el canal oficial de seguridad en GitHub enviando un [aviso de seguridad](https://github.com/axios/axios/security).

## Política de divulgación

Cuando recibamos un reporte de vulnerabilidad de seguridad, asignaremos un responsable principal. Esta persona se encargará del reporte de la vulnerabilidad. El responsable confirmará el problema y determinará las versiones afectadas. Luego evaluará el problema y determinará la gravedad del mismo. El responsable desarrollará una solución para el problema y preparará una versión. El responsable notificará al reportante cuando la solución esté lista para ser anunciada.

## Actualizaciones de seguridad

Las actualizaciones de seguridad se publicarán tan pronto como sea posible después de que el parche haya sido desarrollado y probado. Notificaremos a los usuarios de la versión a través del repositorio GitHub del proyecto. También publicaremos las notas de la versión y los avisos de seguridad en la página de versiones de GitHub del proyecto. Además, marcaremos como obsoletas todas las versiones que contengan la vulnerabilidad de seguridad.

## Colaboradores y reconocimientos de seguridad

Nos gustaría agradecer a los siguientes investigadores de seguridad por trabajar con nosotros para ayudar a que el proyecto sea seguro para todos:

- [Socket Dev](https://socket.dev/)
- [GitHub Security Lab](https://securitylab.github.com/)
