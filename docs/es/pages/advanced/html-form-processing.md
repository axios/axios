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
    "prop": "2"
  },
  "deep prop spaced": "3",
  "baz": ["4", "5"],
  "user": {
    "age": "value2"
  }
}
```

::: tip Notación de rutas en nombres de campo
Solo la notación con puntos y corchetes crea rutas de propiedades. Los demás caracteres —incluidos espacios, `-`, `+`, `*` y `&`— permanecen en nombres de campo literales. Por ejemplo, `deep.prop` crea una ruta anidada, mientras que `deep prop spaced` permanece como una clave de nivel superior.
:::

::: warning
Actualmente no se admite el envío de Blobs/Files como JSON (base64).
:::
