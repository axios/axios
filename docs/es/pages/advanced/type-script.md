# TypeScript

`axios` incluye definiciones de tipos para TypeScript. Estas se encuentran en el paquete npm de `axios` mediante el archivo `index.d.ts`. Dado que axios publica de forma dual con una exportación por defecto ESM y un `module.exports` CJS, existen algunas consideraciones a tener en cuenta:

- La configuración recomendada es usar `"moduleResolution": "node16"` (esto es implícito en `"module": "node16"`). Ten en cuenta que esto requiere TypeScript 4.7 o superior.
- Si usas ESM, tu configuración debería estar bien.
- Si compilas TypeScript a CJS y no puedes usar `"moduleResolution": "node16"`, debes habilitar `esModuleInterop`.
- Si usas TypeScript para verificar tipos en código JavaScript CJS, tu única opción es usar `"moduleResolution": "node16"`.
