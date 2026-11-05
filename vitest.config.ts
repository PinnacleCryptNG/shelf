import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "server-only": fileURLToPath(new URL("./src/test/server-only.ts", import.meta.url)),
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    env: { PGLITE_DIR: "memory://", DATABASE_URL: "", POSTGRES_URL: "", PAYPAL_CLIENT_ID: "", PAYPAL_CLIENT_SECRET: "" },
    testTimeout: 30_000,
  },
});
