# TypeScript

`axios` inclut des définitions de types pour TypeScript. Elles sont incluses dans le package npm `axios` via le fichier `index.d.ts`. Comme axios publie à la fois avec un export par défaut ESM et un `module.exports` CJS, il existe quelques nuances à prendre en compte :

- Le paramètre recommandé est d'utiliser `"moduleResolution": "node16"` (impliqué par `"module": "node16"`). Notez que cela nécessite TypeScript 4.7 ou supérieur.
- Si vous utilisez ESM, vos paramètres devraient convenir.
- Si vous compilez TypeScript en CJS et ne pouvez pas utiliser `"moduleResolution": "node16"`, vous devez activer `esModuleInterop`.
- Si vous utilisez TypeScript pour vérifier les types de code JavaScript CJS, votre seule option est d'utiliser `"moduleResolution": "node16"`.
