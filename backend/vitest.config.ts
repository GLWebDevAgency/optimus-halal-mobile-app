import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./src/__tests__/setup.ts"],
    include: ["src/__tests__/**/*.test.ts"],
    testTimeout: 15_000,
    hookTimeout: 30_000,
    pool: "forks",
    // Integration tests share a single DB — run files sequentially to avoid
    // TRUNCATE race conditions between parallel workers
    fileParallelism: false,
    alias: {
      "@/*": path.resolve(__dirname, "./src/*"),
    },
  },
});
