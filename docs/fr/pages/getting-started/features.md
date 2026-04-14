# Fonctionnalités

axios est un client HTTP puissant qui propose une API simple et facile à utiliser pour effectuer des requêtes HTTP. Il prend en charge tous les navigateurs modernes et est largement utilisé dans la communauté JavaScript. Voici quelques-unes des fonctionnalités qui font d'axios un excellent choix pour votre prochain projet.

## Isomorphique

axios est un client HTTP universel qui peut être utilisé aussi bien dans le navigateur que dans Node.js. Cela signifie que vous pouvez utiliser axios pour effectuer des requêtes API depuis votre code frontend aussi bien que depuis votre code backend. Cela fait d'axios un excellent choix pour développer des applications web progressives, des applications monopages et des applications avec rendu côté serveur.

axios est également un excellent choix pour les équipes qui travaillent à la fois sur le frontend et le backend. En utilisant axios pour les deux, vous disposez d'une API cohérente pour effectuer des requêtes HTTP, ce qui peut contribuer à réduire la complexité de votre code.

## Support Fetch <Badge type="tip" text="Nouveau" />

axios offre une prise en charge de premier plan de l'API Fetch, qui est un remplacement moderne de l'API XHR. L'adaptateur est optionnel et peut être activé via la configuration. La même API est maintenue pour les adaptateurs XHR et Fetch, ce qui facilite l'adoption de l'API Fetch dans votre code sans modifier votre code existant.

## Support des navigateurs

axios prend en charge tous les navigateurs modernes et certains navigateurs plus anciens, notamment Chrome, Firefox, Safari et Edge. axios est un excellent choix pour développer des applications web devant prendre en charge un large éventail de navigateurs.

## Support de Node.js

axios supporte également un large éventail de versions de Node.js, avec une compatibilité testée jusqu'à la version v12.x, ce qui en fait un bon choix dans les environnements où la mise à jour vers la dernière version de Node.js n'est pas possible ou pratique.

En plus de Node.js, axios dispose de tests de fumée pour Bun et Deno qui valident les comportements clés de l'exécution et renforcent la confiance dans la compatibilité multi-environnements.

## Fonctionnalités supplémentaires

- Support de l'API Promise
- Interception des requêtes et des réponses
- Transformation des données de requête et de réponse
- Abort controller
- Délais d'attente (timeouts)
- Sérialisation des paramètres de requête avec support des entrées imbriquées
- Sérialisation automatique du corps de la requête vers :
  - JSON (application/json)
  - Multipart / FormData (multipart/form-data)
  - Formulaire encodé en URL (application/x-www-form-urlencoded)
- Envoi de formulaires HTML en JSON
- Gestion automatique des données JSON dans la réponse
- Capture de la progression pour les navigateurs et Node.js avec des informations supplémentaires (vitesse de transfert, temps restant)
- Limitation de la bande passante pour Node.js
- Compatible avec les implémentations conformes de FormData et Blob (y compris Node.js)
- Protection côté client contre les attaques XSRF
