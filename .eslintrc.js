module.export = {
    "env": {
        "browser": true,
        "es6": true,
        "node": true
    },
    "extends": [
        //        "eslint:recommended",
        //        "plugin:@typescript-eslint/eslint-recommended",
        //        "plugin:@typescript-eslint/recommended"
    ],
    "globals": {
        "Atomics": "readonly",
        "SharedArrayBuffer": "readonly"
    },
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "ecmaVersion": 11,
        "sourceType": "module"
    },
    "plugins": [
        "@typescript-eslint/eslint-plugin"
    ],
    "rules": {
        // 건드리지 마시오
        "indent": ["error", 4, {
            "SwitchCase": 1
        }],
        "no-empty-pattern": 0,
        "quotes": ["error", "single"],
        "camelcase": ["warn", {
            "properties": "always",
            "ignoreDestructuring": false
        }],
        "array-bracket-spacing": ["error", "never", {
            "singleValue": false,
            "objectsInArrays": false
        }],
        "arrow-spacing": ["error", {
            "before": true,
            "after": true
        }],
        "block-spacing": ["error"],
        "brace-style": ["error", "stroustrup", {
            "allowSingleLine": true
        }], // "stroustrup" 또는 "1tbs" 사용 가능
        "comma-spacing": ["error", {
            "before": false,
            "after": true
        }],
        "curly": ["error"],
        "eqeqeq": ["error", "smart"],
        "func-call-spacing": ["error", "never"],
        "keyword-spacing": ["error", {
            "before": true,
            "after": true
        }],
        "no-caller": ["error"],
        "no-extend-native": ["error"],
        "no-extra-boolean-cast": ["off"],

        /**
         * 아래쪽에 본인 스타일 적용
         */
        //        "no-empty": ["warn", {
        //            "allowEmptyCatch": true
        //        }],
        //        "@typescript-eslint/no-inferrable-types": ["error", {
        //            "ignoreParameters": true,
        //            "ignoreProperties": true
        //        }],
        //        "@typescript-eslint/no-var-requires": ["off"],
        //        "@typescript-eslint/no-empty-function": ["error"]
    }
}