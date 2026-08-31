import eslint from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

export default [
  eslint.configs.recommended,
  {
    ignores: [".next/**", "node_modules/**", "coverage/**", "next-env.d.ts"],
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: "latest", sourceType: "module" },
      globals: {
        console: "readonly",
        fetch: "readonly",
        FormData: "readonly",
        Headers: "readonly",
        HTMLFormElement: "readonly",
        process: "readonly",
        Request: "readonly",
        Response: "readonly",
        URL: "readonly",
      },
    },
    plugins: { "@typescript-eslint": tsPlugin, "@next/next": nextPlugin },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },
];
