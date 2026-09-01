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
  {
    // Frontend components run in the browser; DOM element and event types are
    // ambient there. Backend modules keep the narrower global list above.
    files: [
      "src/app/**/*.tsx",
      "src/components/**/*.tsx",
      "src/features/**/*.{ts,tsx}",
    ],
    languageOptions: {
      globals: {
        AbortController: "readonly",
        clearTimeout: "readonly",
        document: "readonly",
        EventTarget: "readonly",
        HTMLAnchorElement: "readonly",
        HTMLDialogElement: "readonly",
        HTMLButtonElement: "readonly",
        HTMLInputElement: "readonly",
        HTMLSelectElement: "readonly",
        KeyboardEvent: "readonly",
        navigator: "readonly",
        setTimeout: "readonly",
        SVGSVGElement: "readonly",
        URLSearchParams: "readonly",
        window: "readonly",
      },
    },
  },
];
