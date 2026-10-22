# Versionnage sémantique

Le versionnage sémantique est un schéma de versionnage utilisé pour communiquer la nature des changements dans un package logiciel. C'est un ensemble simple de règles et d'exigences qui dictent comment les numéros de version sont attribués et incrémentés.

## Versionnage d'axios

axios suit le schéma de versionnage sémantique. Cela signifie que chaque version d'axios se voit attribuer un numéro de version composé de trois parties : majeure, mineure et correctif. Le numéro de version est incrémenté en fonction de la nature des changements apportés dans la version.

Dans le passé, axios n'a pas toujours strictement suivi le versionnage sémantique, mais à l'avenir, une adhérence beaucoup plus stricte au schéma de versionnage sémantique sera maintenue pour garantir que les utilisateurs peuvent se fier aux numéros de version pour communiquer la nature des changements dans la bibliothèque.

Un bref aperçu du schéma de versionnage est fourni ci-dessous.

## Format de version

Un numéro de version sémantique est composé de trois parties :

1. Version majeure
2. Version mineure
3. Version de correctif

Le numéro de version est écrit sous la forme `MAJEURE.MINEURE.CORRECTIF`. Chaque partie du numéro de version a une signification spécifique :

- **Version majeure** : Incrémentée lorsque vous effectuez des changements d'API incompatibles.
- **Version mineure** : Incrémentée lorsque vous ajoutez des fonctionnalités de manière rétrocompatible.
- **Version de correctif** : Incrémentée lorsque vous effectuez des corrections de bugs rétrocompatibles.

## Versions de pré-publication

En plus des trois parties du numéro de version, vous pouvez ajouter une version de pré-publication. Cela se fait en ajoutant un tiret et une série d'identifiants séparés par des points immédiatement après la version de correctif. Par exemple, `1.0.0-alpha.1`.

Les versions de pré-publication sont utilisées pour indiquer qu'une version est instable et peut ne pas satisfaire les exigences de compatibilité prévues telles qu'indiquées par le numéro de version. Les versions de pré-publication sont ordonnées en fonction de l'ordre des identifiants. Par exemple, `1.0.0-alpha.1` vient avant `1.0.0-alpha.2`.

## Plages de versions

Lorsque vous spécifiez une plage de versions pour un package, vous pouvez utiliser une variété d'opérateurs pour spécifier la plage de versions acceptables. Les opérateurs suivants sont disponibles :

- `>` : Supérieur à
- `<` : Inférieur à
- `>=` : Supérieur ou égal à
- `<=` : Inférieur ou égal à
- `~` : Approximativement égal à
- `^` : Compatible avec

Par exemple, `^1.0.0` signifie que toute version supérieure ou égale à `1.0.0` et inférieure à `2.0.0` est acceptable.
