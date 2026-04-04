# TypeScript

`axios` supports type definitions for TypeScript. These are included in the `axios` npm package by means of the `index.d.ts` file. Because axios dual publishes with an ESM default export and a CJS module.exports, there are some caveats:

- The recommended setting is to use "moduleResolution": "node16" (this is implied by "module": "node16"). Note that this requires TypeScript 4.7 or greater.
- If you use ESM, your settings should be fine.
- If you compile TypeScript to CJS and you can’t use "moduleResolution": "node 16", you have to enable esModuleInterop.
- If you use TypeScript to type check CJS JavaScript code, your only option is to use "moduleResolution": "node16".
