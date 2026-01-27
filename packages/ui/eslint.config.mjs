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
    },
];
