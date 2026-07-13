import eslint from "@eslint/js";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import globals from "globals";
import tseslint from "typescript-eslint";
import requirePublicJsdoc from "./eslint-rules/require-public-jsdoc.mjs";

const aiReadinessPlugin = {
  rules: { "require-public-jsdoc": requirePublicJsdoc },
};

export default tseslint.config(
  { ignores: ["eslint.config.mjs", "**/dist/", "node_modules/", "coverage/", "scripts/", "eslint-rules/"] },
  eslint.configs.recommended,
  eslintPluginPrettierRecommended,
  {
    files: ["packages/**/*.ts", "apps/**/*.ts"],
    plugins: {
      "ai-readiness": aiReadinessPlugin,
      "@typescript-eslint": tseslint.plugin,
    },
    languageOptions: {
      parser: tseslint.parser,
      globals: { ...globals.node, ...globals.jest },
      sourceType: "module",
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-floating-promises": "off",
      "prettier/prettier": ["error", { endOfLine: "auto" }],
      "ai-readiness/require-public-jsdoc": "warn",
    },
  },
);
