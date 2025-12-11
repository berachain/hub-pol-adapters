import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["src/index.ts"],
    bundle: true,
    format: ["esm", "cjs"],
    platform: "node",
    target: "node20",
    noExternal: ["graphql-request"],
    skipNodeModulesBundle: false,
});
