import { describe, it, expect } from "vitest";
import { SxVaultAdapter } from "./adapter";
import {
  createMockPublicClient,
  createMockGetTokenPrices,
  createFailingGetTokenPrices,
} from "../../test/helpers";

const WBERA = "0x6969696969696969696969696969696969696969";

describe("SxVaultAdapter", () => {
  it("returns correct tokens", async () => {
    const adapter = new SxVaultAdapter();
    const tokens = await adapter.getTokens();
    expect(tokens.length).toBe(1);
    expect(tokens[0].symbol).toBe("SXBRT");
  });

  it("prices SXBRT at the WBERA price", async () => {
    const adapter = new SxVaultAdapter({
      publicClient: createMockPublicClient(),
      getTokenPrices: createMockGetTokenPrices({
        [WBERA]: 5.5,
      }),
    });

    const tokens = await adapter.getTokens();
    const results = await adapter.getTokenPrices(tokens);

    expect(results).toHaveLength(1);
    expect(results[0].status).toBe("fulfilled");
    if (results[0].status === "fulfilled") {
      expect(results[0].price).toBe(5.5);
      expect(results[0].source).toBe("SxVaultAdapter");
    }
  });

  it("isolates errors per token", async () => {
    const adapter = new SxVaultAdapter({
      publicClient: createMockPublicClient(),
      getTokenPrices: createFailingGetTokenPrices("API down"),
    });

    const tokens = await adapter.getTokens();
    const results = await adapter.getTokenPrices(tokens);

    expect(results).toHaveLength(1);
    for (const r of results) {
      expect(r.status).toBe("rejected");
      if (r.status === "rejected") {
        expect(r.error).toContain("API down");
        expect(r.source).toBe("SxVaultAdapter");
      }
    }
  });
});
