import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  // tsconfig keeps `jsx: preserve` for Next; the test transform needs a runtime.
  esbuild: { jsx: "automatic" },
  test: { environment: "node" },
});
