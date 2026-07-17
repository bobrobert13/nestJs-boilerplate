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
      globals: {
        ...globals.node,
        ...globals.jest,
        // The `globals` package does not expose the `NodeJS` namespace by
        // default; allow it so `NodeJS.Timeout`, `NodeJS.ReadableStream`,
        // etc., pass the `no-undef` rule without prefixing every file
        // with a triple-slash reference.
        NodeJS: "readonly",
      },
      sourceType: "module",
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-floating-promises": "off",
      // Use @typescript-eslint/no-unused-vars (which understands
      // parameter properties like `private readonly foo`) instead of the
      // base no-unused-vars which produces false positives on NestJS DI.
      // Prefix args/vars with `_` to opt out of the check.
      "@typescript-eslint/no-unused-vars": [
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
      "no-unused-vars": "off",
      "prettier/prettier": ["error", { endOfLine: "auto" }],
      "ai-readiness/require-public-jsdoc": "warn",
    },
  },
  // Interfaces only declare contracts; method parameters are not "used"
  // in the body. Disable the unused-vars check there to avoid false positives.
  {
    files: ["**/*.interface.ts"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  // Enum files: members are part of the public API and may be consumed
  // elsewhere via TypeScript types, which the unused-vars rule
  // does not understand. Disable for enum files.
  {
    files: ["**/*.enum.ts"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
);
