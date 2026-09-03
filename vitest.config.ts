import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // `server-only` throws on import outside an RSC, which makes any module
      // carrying that guard untestable. Stubbed for tests only; the real guard
      // still applies to the application build.
      "server-only": fileURLToPath(new URL("./src/test/server-only.stub.ts", import.meta.url)),
    },
  },
  // tsconfig keeps `jsx: preserve` for Next; the test transform needs a runtime.
  esbuild: { jsx: "automatic" },
  test: { environment: "node" },
});
