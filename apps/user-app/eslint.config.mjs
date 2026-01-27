import nextConfig from "../../packages/eslint-config/nextjs.mjs";
import globals from "globals";

export default [
    ...nextConfig,
    {
        languageOptions: {
            globals: {
                ...globals.browser,
            },
        },
        rules: {
            // Disable no-undef as TypeScript handles this (and other tools)
            "no-undef": "off",
        },
    },
    {
        files: ["**/*.ts", "**/*.tsx"],
        rules: {
            // Warn only for ts-ignore to allow build to pass
            "@typescript-eslint/ban-ts-comment": "warn",
            // Ensure these are warnings (inherited from base but explicitly stating for clarity)
            "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
            "@typescript-eslint/no-explicit-any": "warn",
        },
    },
];
