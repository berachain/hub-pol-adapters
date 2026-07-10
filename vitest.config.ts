import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    // Unit tests only. src/test/debug.test.ts hits live RPC + the Berachain
    // API and is run manually: `npx vitest run --dir src/test`.
    include: ["src/adapters/**/*.test.ts", "src/types/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/adapters/**/*.ts", "src/types/**/*.ts"],
      exclude: ["src/**/*.test.ts"],
    },
  },
});
