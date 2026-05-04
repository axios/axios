# Envío de formularios HTML (navegador) <Badge type="tip" text="Nuevo" />

También puedes enviar un formulario directamente desde un elemento de formulario HTML. Esto es útil cuando tienes un formulario en tu página y deseas enviarlo sin escribir código JavaScript adicional.

```js
await axios.postForm('https://httpbin.org/post', document.querySelector('#htmlForm'));
```

Los objetos `FormData` y `HTMLForm` también pueden enviarse como `JSON` estableciendo explícitamente el encabezado `Content-Type` en `application/json`:

```js
await axios.post('https://httpbin.org/post', document.querySelector('#htmlForm'), {
  headers: {
    'Content-Type': 'application/json',
  },
});
```

Un ejemplo de un formulario válido que puede ser enviado con el código anterior es:

```html
<form id="htmlForm">
  <input type="text" name="foo" value="1" />
  <input type="text" name="deep.prop" value="2" />
  <input type="text" name="deep prop spaced" value="3" />
  <input type="text" name="baz" value="4" />
  <input type="text" name="baz" value="5" />

  <select name="user.age">
    <option value="value1">Value 1</option>
    <option value="value2" selected>Value 2</option>
    <option value="value3">Value 3</option>
  </select>

  <input type="submit" value="Save" />
</form>
```

El formulario anterior se enviará como:

```json
{
  "foo": "1",
  "deep": {
    "prop": {
      "spaced": "3"
    }
  },
  "baz": ["4", "5"],
  "user": {
    "age": "value2"
  }
}
```

::: tip Las colisiones de rutas sobrescriben los valores anteriores
Los nombres de campo se analizan como rutas de propiedad dividiendo por `.`, corchetes o espacios en blanco. Dos inputs cuyas rutas se solapan colisionarán: en el ejemplo anterior, `deep.prop` se analiza como `["deep", "prop"]` y `deep prop spaced` como `["deep", "prop", "spaced"]`, por lo que la asignación más profunda reemplaza `deep.prop = "2"` por el objeto anidado `{ spaced: "3" }`. Elige nombres de campo no superpuestos si necesitas conservar ambos valores.
:::

::: warning
Actualmente no se admite el envío de Blobs/Files como JSON (base64).
:::
