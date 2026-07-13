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
      // Ignore args/properties prefixed with underscore (NestJS DI convention:
      // private readonly _serviceName is acceptable, and Strategy callbacks
      // often pass an unused _context).
      "no-unused-vars": [
        "error",
        {
          args: "after-used",
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      "prettier/prettier": ["error", { endOfLine: "auto" }],
      "ai-readiness/require-public-jsdoc": "warn",
    },
  },
  // Interfaces only declare contracts; method parameters are not "used"
  // in the body. Disable the unused-vars check there to avoid false positives.
  {
    files: ["**/*.interface.ts"],
    rules: {
      "no-unused-vars": "off",
    },
  },
  // Enum files: members are part of the public API and may be consumed
  // elsewhere via TypeScript types, which the base no-unused-vars rule
  // does not understand. Disable for enum files.
  {
    files: ["**/*.enum.ts"],
    rules: {
      "no-unused-vars": "off",
    },
  },
);
