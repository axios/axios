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

## Verificar una publicación

Cada tarball de `axios` publicado en npm proviene de GitHub Actions y lleva una [atestación de provenance de npm](https://docs.npmjs.com/generating-provenance-statements) que vincula criptográficamente el paquete al workflow y al SHA del commit que lo generó.

Los consumidores pueden verificar la provenance localmente:

```bash
# Verifica todos los paquetes de tu lockfile, incluido axios
npm audit signatures
```

Una verificación exitosa demuestra que el tarball fue construido en el entorno de GitHub Actions de `axios/axios` sobre un commit conocido — no fue alterado entre la compilación y el registro. **No** demuestra que el código de ese commit esté libre de bugs.

Si `npm audit signatures` reporta una atestación ausente o inválida para una versión reciente de `axios`, trátalo como un posible incidente de cadena de suministro y repórtalo por el canal privado indicado abajo.

## Reportar una vulnerabilidad

Si crees haber encontrado una vulnerabilidad de seguridad en el proyecto, por favor repórtanosla como se describe a continuación. Tomamos todas las vulnerabilidades de seguridad con seriedad. Si has encontrado una vulnerabilidad en una librería de terceros, por favor repórtala a los responsables de esa librería.

## Proceso de reporte

Por favor, no reportes vulnerabilidades de seguridad a través de los issues públicos de GitHub. Usa el canal oficial de seguridad en GitHub enviando un [aviso de seguridad](https://github.com/axios/axios/security/advisories/new).

## Política de divulgación

Cuando recibimos un reporte de vulnerabilidad, asignamos un responsable principal. El responsable confirma el problema, determina las versiones afectadas, evalúa la gravedad, desarrolla y publica una corrección, y coordina la divulgación pública con quien reportó.

### Compromiso de resolución y divulgación en 60 días

Nos comprometemos a **resolver y divulgar públicamente cada aviso de seguridad válido dentro de los 60 días naturales posteriores al reporte inicial**, contados desde el momento en que se recibe el reporte a través del [canal de avisos de seguridad de GitHub](https://github.com/axios/axios/security/advisories/new).

El plazo de 60 días es un compromiso con quienes reportan y con los consumidores aguas abajo — es un mínimo exigible, no una meta. Si no podemos entregar una corrección a tiempo, publicamos de todos modos el aviso el día 60 con la mejor guía de mitigación disponible para que los consumidores puedan actuar.

**Hitos dentro de la ventana de 60 días:**

| Día  | Hito                                                                                                                                                 |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | Reporte recibido. Aviso privado abierto en GitHub.                                                                                                   |
| ≤ 3  | Acuse de recibo enviado a quien reporta. Decisión de triaje: dentro de alcance / fuera de alcance / duplicado / falta información.                   |
| ≤ 10 | Gravedad evaluada (CVSS v4 cuando aplique). Versiones afectadas confirmadas. CVE solicitado vía GitHub si procede un identificador público.          |
| ≤ 45 | Corrección desarrollada, revisada y probada. Candidata de versión preparada en rama privada. Se ofrece vista previa a quien reporta para validación. |
| ≤ 60 | Versión parcheada publicada en npm. Aviso público + CVE publicados. Se acredita a quien reportó salvo solicitud contraria. CHANGELOG actualizado.    |

**Excepciones y prórrogas.**

- Si quien reporta solicita un embargo más corto (por ejemplo, planea presentar los hallazgos en una conferencia), lo acomodamos cuando sea posible.
- Si la corrección requiere un cambio disruptivo, coordinación con consumidores aguas abajo importantes, o una publicación upstream de `follow-redirects` / `form-data` / `proxy-from-env`, podemos extender más allá de los 60 días. Cualquier prórroga se divulga públicamente el día 60 vía el aviso, con un ETA revisado y el motivo.
- Si un reporte está **fuera de alcance** (por ejemplo, cae bajo un non-goal explícito documentado en el [modelo de amenazas](https://github.com/axios/axios/blob/v1.x/THREATMODEL.md) del proyecto), lo cerramos con una explicación dentro de la ventana de triaje (≤ 3 días). Los reportes fuera de alcance no entran en la cola de 60 días.
- Las **vulnerabilidades activamente explotadas** se tratan como incidentes: la corrección y el aviso salen tan pronto como se valide un parche, no según el calendario de 60 días.

**Expectativas sobre quien reporta.**

Mientras un reporte esté bajo embargo, pedimos que se abstengan de divulgación pública hasta el primero de: (a) la publicación coordinada del aviso, o (b) el día 60. Si la fecha límite de 60 días pasa sin acción de nuestra parte, quien reportó queda libre de divulgar por su cuenta — consideraremos eso un fallo nuestro, no suyo.

## Actualizaciones de seguridad

Las actualizaciones de seguridad se publican tan pronto como sea posible después de desarrollar y probar el parche. Notificamos a los usuarios a través del repositorio GitHub del proyecto y publicamos las notas de la versión y los avisos de seguridad en la página de versiones de GitHub. Además, marcamos como obsoletas todas las versiones que contengan la vulnerabilidad.

## Respuesta a incidentes del lado del mantenedor

Para escenarios de compromiso que afecten cuentas de mantenedores, estaciones de trabajo o infraestructura de publicación (phishing, pérdida de llave hardware, tag o publicación inesperados), el proyecto mantiene un runbook interno de respuesta a incidentes en [THREATMODEL.md §3.7](https://github.com/axios/axios/blob/v1.x/THREATMODEL.md#37-incident-response-runbook). Cubre revocación de sesiones, rotación de llaves, notificación aguas abajo y procedimientos de unpublish/deprecate.

## Colaboradores y reconocimientos de seguridad

Nos gustaría agradecer a los siguientes investigadores de seguridad por trabajar con nosotros para ayudar a que el proyecto sea seguro para todos:

- [Socket Dev](https://socket.dev/)
- [GitHub Security Lab](https://securitylab.github.com/)
