import { afterEach, describe, expect, it, vi } from "vitest";
import {
  BasePriceAdapter,
  type PriceQueryOptions,
  type Token,
  type TokenPriceResult,
} from ".";

// Minimal concrete subclass to exercise the protected fetchTokenPrice helper.
class TestAdapter extends BasePriceAdapter {
  readonly name = "TestAdapter";
  async getTokens(): Promise<Token[]> {
    return [];
  }
  async getTokenPrices(): Promise<TokenPriceResult[]> {
    return [];
  }
  // expose the protected helper for testing
  fetch(tokens: string[], opts?: PriceQueryOptions) {
    return this.fetchTokenPrice(tokens, opts);
  }
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("BasePriceAdapter.fetchTokenPrice", () => {
  it("rejects historical queries on the Berachain API fallback (no getTokenPrices)", async () => {
    const adapter = new TestAdapter({ publicClient: {} as never });
    await expect(adapter.fetch(["0xabc"], { timestamp: 1_700_000_000_000 })).rejects.toThrow(
      /Historical prices require an injected getTokenPrices/,
    );
    await expect(adapter.fetch(["0xabc"], { blockNumber: 123n })).rejects.toThrow(
      /Historical prices require an injected getTokenPrices/,
    );
  });

  it("surfaces a GraphQL error body instead of a raw TypeError", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ errors: [{ message: "rate limited" }], data: null }), {
        status: 200,
      }),
    );
    const adapter = new TestAdapter({ publicClient: {} as never });
    await expect(adapter.fetch(["0xabc"])).rejects.toThrow(/rate limited/);
  });

  it("forwards opts to an injected getTokenPrices", async () => {
    const getTokenPrices = vi.fn().mockResolvedValue([]);
    const adapter = new TestAdapter({ publicClient: {} as never, getTokenPrices });
    const opts = { timestamp: 42 };
    await adapter.fetch(["0xabc"], opts);
    expect(getTokenPrices).toHaveBeenCalledWith(["0xabc"], opts);
  });
});
