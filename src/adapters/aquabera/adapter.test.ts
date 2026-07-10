import { describe, it, expect, vi } from "vitest";
import { AquaBeraAdapter } from "./adapter";
import { createMockGetTokenPrices } from "../../test/helpers";
import type { PublicClient } from "viem";

describe("AquaBeraAdapter", () => {
  it("returns the LP tokens", async () => {
    const adapter = new AquaBeraAdapter();
    const tokens = await adapter.getTokens();
    expect(tokens.length).toBe(2);
    expect(tokens.some((t) => t.symbol === "AB-KODIAK-WBERA-BERAMO")).toBe(true);
    expect(tokens.some((t) => t.symbol === "AB-KODIAK-WBERA-HENLO")).toBe(true);
  });

  it("prices LP token correctly from on-chain data", async () => {
    // totalSupply = 100e18, totalAmount0 = 50e18 (18 decimals, price 5.0),
    // totalAmount1 = 200e6 (6 decimals, price 0.5)
    // expected LP price = (50 * 5 + 200 * 0.5) / 100 = (250 + 100) / 100 = 3.5
    const token0 = "0xaaaa";
    const token1 = "0xbbbb";

    const publicClient = {
      multicall: vi
        .fn()
        // first call: totalSupply, getTotalAmounts, token0, token1
        .mockResolvedValueOnce([
          BigInt(100e18),
          [BigInt(50e18), BigInt(200e6)],
          token0,
          token1,
        ])
        // second call: token0/token1 decimals
        .mockResolvedValueOnce([18, 6]),
    } as unknown as PublicClient;

    const adapter = new AquaBeraAdapter({
      publicClient,
      getTokenPrices: createMockGetTokenPrices({
        "0xaaaa": 5.0,
        "0xbbbb": 0.5,
      }),
    });

    const lpToken = {
      address: "0xf9845a03F7e6b06645A03a28b943C8A4B5fE7BCC" as `0x${string}`,
      symbol: "AB-KODIAK-WBERA-BERAMO",
      name: "test",
      decimals: 18,
      chainId: 80094,
    };

    const results = await adapter.getTokenPrices([lpToken]);
    expect(results).toHaveLength(1);
    expect(results[0].status).toBe("fulfilled");
    if (results[0].status === "fulfilled") {
      expect(results[0].price).toBeCloseTo(3.5, 5);
    }
  });

  it("rejects LP token when totalSupply is 0", async () => {
    const publicClient = {
      multicall: vi.fn().mockResolvedValue([
        0n,
        [BigInt(50e18), BigInt(200e18)],
        "0xaaaa",
        "0xbbbb",
      ]),
    } as unknown as PublicClient;

    const adapter = new AquaBeraAdapter({
      publicClient,
      getTokenPrices: createMockGetTokenPrices({ "0xaaaa": 5.0, "0xbbbb": 0.5 }),
    });

    const lpToken = {
      address: "0xf9845a03F7e6b06645A03a28b943C8A4B5fE7BCC" as `0x${string}`,
      symbol: "test",
      name: "test",
      decimals: 18,
      chainId: 80094,
    };

    const results = await adapter.getTokenPrices([lpToken]);
    expect(results[0].status).toBe("rejected");
    if (results[0].status === "rejected") {
      expect(results[0].error).toContain("totalSupply is 0");
    }
  });

  it("isolates errors per token", async () => {
    const publicClient = {
      multicall: vi.fn().mockRejectedValue(new Error("RPC fail")),
    } as unknown as PublicClient;

    const adapter = new AquaBeraAdapter({
      publicClient,
      getTokenPrices: createMockGetTokenPrices({}),
    });

    const tokens = await adapter.getTokens();
    const results = await adapter.getTokenPrices(tokens);
    expect(results).toHaveLength(2);
    for (const r of results) {
      expect(r.status).toBe("rejected");
    }
  });
});
