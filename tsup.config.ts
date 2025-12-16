import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["src/index.ts"],
    bundle: true,
    dts: true,
    format: ["esm", "cjs"],
    platform: "node",
    target: "node20",
    clean: true,
    noExternal: ["graphql-request"],
    skipNodeModulesBundle: false,
});
