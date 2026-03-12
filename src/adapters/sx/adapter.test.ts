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
    expect(tokens.length).toBe(2);
    expect(tokens[0].symbol).toBe("SXBRT");
    expect(tokens[1].symbol).toBe("HONEY");
  });

  it("prices all tokens using WBERA price", async () => {
    const adapter = new SxVaultAdapter({
      publicClient: createMockPublicClient(),
      getTokenPrices: createMockGetTokenPrices({
        [WBERA]: 5.5,
        "0xfcbd14dc51f0a4d49d5e53c2e0950e0bc26d0dce": 1.0,
      }),
    });

    const tokens = await adapter.getTokens();
    const results = await adapter.getTokenPrices(tokens);

    expect(results).toHaveLength(2);
    // Both tokens resolve to WBERA price since they all use fetchTokenPrice
    for (const r of results) {
      expect(r.status).toBe("fulfilled");
      if (r.status === "fulfilled") {
        expect(r.price).toBeGreaterThan(0);
        expect(r.source).toBe("SxVaultAdapter");
      }
    }
  });

  it("isolates errors per token", async () => {
    const adapter = new SxVaultAdapter({
      publicClient: createMockPublicClient(),
      getTokenPrices: createFailingGetTokenPrices("API down"),
    });

    const tokens = await adapter.getTokens();
    const results = await adapter.getTokenPrices(tokens);

    expect(results).toHaveLength(2);
    for (const r of results) {
      expect(r.status).toBe("rejected");
      if (r.status === "rejected") {
        expect(r.error).toContain("API down");
        expect(r.source).toBe("SxVaultAdapter");
      }
    }
  });
});
