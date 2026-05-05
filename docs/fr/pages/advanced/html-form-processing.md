# Traitement de formulaires HTML (navigateur) <Badge type="tip" text="Nouveau" />

Vous pouvez également envoyer un formulaire directement depuis un élément de formulaire HTML. Cela est utile lorsque vous avez un formulaire dans votre page et que vous souhaitez le soumettre sans aucun code JavaScript.

```js
await axios.postForm('https://httpbin.org/post', document.querySelector('#htmlForm'));
```

Les objets `FormData` et `HTMLForm` peuvent également être envoyés en `JSON` en définissant explicitement l'en-tête `Content-Type` à `application/json` :

```js
await axios.post('https://httpbin.org/post', document.querySelector('#htmlForm'), {
  headers: {
    'Content-Type': 'application/json',
  },
});
```

Voici un exemple de formulaire valide pouvant être soumis par le code ci-dessus :

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

Le formulaire ci-dessus sera soumis sous la forme :

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

::: tip Les collisions de chemins écrasent les valeurs précédentes
Les noms de champs sont convertis en chemins de propriétés en les divisant sur `.`, les crochets ou les espaces. Deux entrées dont les chemins se chevauchent entreront en collision : dans l'exemple ci-dessus, `deep.prop` est analysé en `["deep", "prop"]` et `deep prop spaced` en `["deep", "prop", "spaced"]`, donc l'affectation plus profonde remplace `deep.prop = "2"` par l'objet imbriqué `{ spaced: "3" }`. Choisissez des noms de champs sans chevauchement si vous avez besoin des deux valeurs.
:::

::: warning
L'envoi de Blobs/Fichiers en JSON (base64) n'est actuellement pas supporté.
:::
