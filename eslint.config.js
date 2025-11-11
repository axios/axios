import js from "@eslint/js";
import globals from "globals";

export default [
    js.configs.recommended,
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.es2018,
                ...globals.node,
            },
            parserOptions: {
                ecmaVersion: 2018,
                sourceType: "module",
            },
        },
        rules: {
            "no-cond-assign": "off",
        },
    }
];
