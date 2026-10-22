# Versionado semántico

El versionado semántico es un esquema de versionado que se usa para comunicar la naturaleza de los cambios en un paquete de software. Es un conjunto simple de reglas y requisitos que dictan cómo se asignan e incrementan los números de versión.

## Versionado de axios

axios sigue el esquema de versionado semántico. Esto significa que cada versión de axios se asigna con un número de versión compuesto por tres partes: mayor, menor y parche. El número de versión se incrementa según la naturaleza de los cambios en la versión.

En el pasado, axios puede que no haya seguido estrictamente el versionado semántico en todo momento; sin embargo, de aquí en adelante se adoptará una adherencia mucho más estricta al esquema de versionado semántico para garantizar que los usuarios puedan confiar en los números de versión para comunicar la naturaleza de los cambios en la librería.

A continuación se proporciona un breve resumen del esquema de versionado.

## Formato de versión

Un número de versión semántico consta de tres partes:

1. Versión mayor
2. Versión menor
3. Versión de parche

El número de versión se escribe como `MAYOR.MENOR.PARCHE`. Cada parte del número de versión tiene un significado específico:

- **Versión mayor**: Se incrementa cuando se realizan cambios incompatibles en la API.
- **Versión menor**: Se incrementa cuando se añade funcionalidad de manera retrocompatible.
- **Versión de parche**: Se incrementa cuando se realizan correcciones de errores retrocompatibles.

## Versiones de prelanzamiento

Además de las tres partes del número de versión, puedes añadir una versión de prelanzamiento. Esto se hace añadiendo un guion y una serie de identificadores separados por puntos inmediatamente después de la versión de parche. Por ejemplo, `1.0.0-alpha.1`.

Las versiones de prelanzamiento se usan para indicar que una versión es inestable y puede no satisfacer los requisitos de compatibilidad indicados por el número de versión. Las versiones de prelanzamiento se ordenan según el orden de los identificadores. Por ejemplo, `1.0.0-alpha.1` viene antes de `1.0.0-alpha.2`.

## Rangos de versiones

Cuando especificas un rango de versiones para un paquete, puedes usar una variedad de operadores para indicar el rango de versiones aceptables. Los siguientes operadores están disponibles:

- `>`: Mayor que
- `<`: Menor que
- `>=`: Mayor o igual que
- `<=`: Menor o igual que
- `~`: Aproximadamente igual a
- `^`: Compatible con

Por ejemplo, `^1.0.0` significa que cualquier versión mayor o igual a `1.0.0` y menor que `2.0.0` es aceptable.
