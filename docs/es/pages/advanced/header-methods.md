# Métodos de encabezados <Badge type="tip" text="Nuevo" />

Con la introducción de la nueva clase `AxiosHeaders`, Axios ofrece un conjunto de métodos para manipular encabezados. Estos métodos se usan para establecer, obtener y eliminar encabezados de una forma más conveniente que manipular directamente el objeto de encabezados.

## Constructor `new AxiosHeaders(headers?)`

El constructor de la clase `AxiosHeaders` acepta un objeto opcional con encabezados para inicializar la instancia. El objeto de encabezados puede contener cualquier número de encabezados, y las claves son insensibles a mayúsculas y minúsculas.

```js
constructor(headers?: RawAxiosHeaders | AxiosHeaders | string);
```

Por conveniencia, puedes pasar una cadena de texto con encabezados separados por un carácter de nueva línea. Los encabezados se analizan y se añaden a la instancia.

```js
const headers = new AxiosHeaders(`
Host: www.bing.com
User-Agent: curl/7.54.0
Accept: */*`);

console.log(headers);

// Object [AxiosHeaders] {
//   host: 'www.bing.com',
//   'user-agent': 'curl/7.54.0',
//   accept: '*/*'
// }
```

## Set (Establecer)

El método `set` se usa para establecer encabezados en la instancia de `AxiosHeaders`. El método puede ser llamado con un nombre de encabezado y un valor únicos, un objeto con múltiples encabezados, o una cadena de texto con encabezados separados por una nueva línea. El método también acepta un parámetro opcional `rewrite` que controla el comportamiento al establecer el encabezado.

```js
set(headerName, value: AxiosHeaderValue, rewrite?: boolean | AxiosHeaderMatcher);
set(headerName, value, rewrite?: (this: AxiosHeaders, value: string, name: string) => boolean);
set(headers?: RawAxiosHeaders | AxiosHeaders | string, rewrite?: boolean);
```

El argumento `rewrite` controla el comportamiento de sobreescritura:

- `false` - no sobreescribir si el valor del encabezado ya está definido (es decir, no es `undefined`)
- `undefined` (predeterminado) - sobreescribir el encabezado a menos que su valor esté establecido en `false`
- `true` - sobreescribir siempre

La opción también puede aceptar una función definida por el usuario que determina si el valor debe ser sobreescrito o no. La función recibe el valor actual, el nombre del encabezado y el objeto de encabezados como argumentos.

`AxiosHeaders` conserva el formato de la primera clave coincidente que encuentra. Puedes usar esto para preservar el formato específico de un encabezado inicializando una clave con `undefined` y luego estableciendo los valores posteriormente. Consulta [Preservar el formato de un encabezado específico](/pages/advanced/headers#preserving-a-specific-header-case).

## Get (Obtener)

El método `get` se usa para recuperar el valor de un encabezado. El método puede ser llamado con un nombre de encabezado único, un matcher opcional o un parser. El matcher tiene valor predeterminado `true`. El parser puede ser una expresión regular que se usa para extraer el valor del encabezado.

```js
get(headerName: string, matcher?: true | AxiosHeaderParser): AxiosHeaderValue;
get(headerName: string, parser: RegExp): RegExpExecArray | null;
```

A continuación se muestra un ejemplo de algunos de los posibles usos del método `get`:

```js
const headers = new AxiosHeaders({
  'Content-Type': 'multipart/form-data; boundary=Asrf456BGe4h',
});

console.log(headers.get('Content-Type'));
// multipart/form-data; boundary=Asrf456BGe4h

console.log(headers.get('Content-Type', true)); // parse key-value pairs from a string separated with \s,;= delimiters:
// [Object: null prototype] {
//   'multipart/form-data': undefined,
//    boundary: 'Asrf456BGe4h'
// }

console.log(
  headers.get('Content-Type', (value, name, headers) => {
    return String(value).replace(/a/g, 'ZZZ');
  })
);
// multipZZZrt/form-dZZZtZZZ; boundZZZry=Asrf456BGe4h

console.log(headers.get('Content-Type', /boundary=(\w+)/)?.[0]);
// boundary=Asrf456BGe4h
```

## Has (Verificar existencia)

El método `has` se usa para verificar si un encabezado existe en la instancia de `AxiosHeaders`. El método puede ser llamado con un nombre de encabezado único y un matcher opcional.

```js
has(header: string, matcher?: AxiosHeaderMatcher): boolean;
```

::: info
Devuelve `true` si el encabezado está definido (tiene un valor que no es `undefined`).
:::

## Delete (Eliminar)

El método `delete` se usa para eliminar un encabezado de la instancia de `AxiosHeaders`. El método puede ser llamado con un nombre de encabezado único y un matcher opcional.

```js
delete(header: string | string[], matcher?: AxiosHeaderMatcher): boolean;
```

::: info
Devuelve `true` si al menos un encabezado fue eliminado.
:::

## Clear (Limpiar)

El método `clear` se usa para eliminar todos los encabezados de la instancia de `AxiosHeaders` si no se pasa ningún argumento. Si se pasa un matcher, solo se eliminan los encabezados que coincidan con él; en este caso, el matcher se compara contra el nombre del encabezado en lugar del valor.

```js
clear(matcher?: AxiosHeaderMatcher): boolean;
```

::: info
Devuelve `true` si al menos un encabezado fue eliminado.
:::

## Normalize (Normalizar)

Si el objeto de encabezados fue modificado directamente, puede generar duplicados con el mismo nombre pero en diferentes formatos. Este método normaliza el objeto de encabezados combinando claves duplicadas en una sola. Axios usa este método internamente después de llamar a cada interceptor. Establece `format` en `true` para convertir los nombres de los encabezados a minúsculas y capitalizar las letras iniciales (`cOntEnt-type` => `Content-Type`) o en `false` para mantener el formato original.

```js
const headers = new AxiosHeaders({
  foo: '1',
});

headers.Foo = '2';
headers.FOO = '3';

console.log(headers.toJSON()); // [Object: null prototype] { foo: '1', Foo: '2', FOO: '3' }
console.log(headers.normalize().toJSON()); // [Object: null prototype] { foo: '3' }
console.log(headers.normalize(true).toJSON()); // [Object: null prototype] { Foo: '3' }
```

::: info
Devuelve `this` para encadenamiento.
:::

## Concat (Concatenar)

Combina la instancia con los objetivos en una nueva instancia de `AxiosHeaders`. Si el objetivo es una cadena de texto, se analizará como encabezados HTTP en formato RAW. Si el objetivo es una instancia de `AxiosHeaders`, se combinará con la instancia actual.

Esto es útil para formatos predefinidos de mayúsculas/minúsculas al componer encabezados. Por ejemplo:

```js
const headers = AxiosHeaders.concat(
  { 'content-type': undefined },
  { 'Content-Type': 'application/octet-stream' }
);
```

```js
concat(...targets: Array<AxiosHeaders | RawAxiosHeaders | string | undefined | null>): AxiosHeaders;
```

::: info
Devuelve una nueva instancia de `AxiosHeaders`.
:::

## toJSON

Resuelve todos los valores de encabezados internos en un nuevo objeto de prototipo nulo. Establece `asStrings` en `true` para resolver los arreglos como una cadena que contiene todos los elementos, separados por comas.

```js
toJSON(asStrings?: boolean): RawAxiosHeaders;
```

## From (Desde)

Devuelve una nueva instancia de `AxiosHeaders` creada a partir de los encabezados en bruto pasados, o simplemente devuelve el objeto de encabezados dado si ya es una instancia de `AxiosHeaders`.

```js
from(thing?: AxiosHeaders | RawAxiosHeaders | string): AxiosHeaders;
```

## Atajos

Los siguientes atajos están disponibles:

- `setContentType`, `getContentType`, `hasContentType`
- `setContentLength`, `getContentLength`, `hasContentLength`
- `setAccept`, `getAccept`, `hasAccept`
- `setUserAgent`, `getUserAgent`, `hasUserAgent`
- `setContentEncoding`, `getContentEncoding`, `hasContentEncoding`
