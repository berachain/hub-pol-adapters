import { defineConfig } from "vitest/config";

// Manual-only config for the live integration test (hits real RPC + the
// Berachain API). Run with `npm run test:debug` — kept out of `npm test`/CI.
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/test/debug.test.ts"],
    testTimeout: 60_000,
  },
});
