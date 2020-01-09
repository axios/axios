module.exports = {
    "globals": {
        "console": true,
        "module": true,
        "require": true
    },
    "env": {
        "browser": true,
        "node": true
    },
    "rules": {
        /**
         * Strict mode
         */
        "strict": [2, "global"],         // http://eslint.org/docs/rules/strict
        
        /**
         * Style
         */
        // 强制使用一致的缩进
        "indent": ["error", 4],
        // 强制在 function的左括号之前使用一致的空格
        "space-before-function-paren": "error",
        // 禁止在函数标识符和其调用之间有空格
        "func-call-spacing": ["error", "never"]
    }
}
