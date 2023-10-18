import js from "@eslint/js";

export default [
    js.configs.recommended,
    {
        rules: {
            "no-cond-assign": 0
        },
    }
];
