import { describe, it, expect, vi } from "vitest";
import { BrownFiVaultAdapter } from "./adapter";
import { createMockGetTokenPrices } from "../../test/helpers";
import type { PublicClient } from "viem";

describe("BrownFiVaultAdapter", () => {
  it("returns LP and incentive tokens", async () => {
    const adapter = new BrownFiVaultAdapter();
    const tokens = await adapter.getTokens();
    expect(tokens.length).toBe(4);
  });

  it("prices LP token using token balances and prices", async () => {
    // Setup: LP with two underlying tokens
    // token0 balance = 1000e6 (USDC, 6 decimals), price = 1.0
    // token1 balance = 100e18 (WBERA, 18 decimals), price = 5.0
    // totalSupply = 500e18
    // LP price = (1000 * 1.0 + 100 * 5.0) / 500 = 1500/500 = 3.0

    const token0Addr = "0xaaaa";
    const token1Addr = "0xbbbb";

    let callCount = 0;
    const publicClient = {
      multicall: vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call: totalSupply, token0, token1
          return Promise.resolve([BigInt(500e18), token0Addr, token1Addr]);
        }
        // Second call: balances and decimals
        return Promise.resolve([
          BigInt(1000e6), // token0 balance
          BigInt(100e18), // token1 balance
          6, // token0 decimals
          18, // token1 decimals
        ]);
      }),
    } as unknown as PublicClient;

    const adapter = new BrownFiVaultAdapter({
      publicClient,
      getTokenPrices: createMockGetTokenPrices({
        "0xaaaa": 1.0,
        "0xbbbb": 5.0,
      }),
    });

    const token = {
      address: "0xd932c344e21ef6C3a94971bf4D4cC71304E2a66C" as `0x${string}`,
      symbol: "BF-V2",
      name: "BrownFi V2",
      decimals: 18,
      chainId: 80094,
    };

    const results = await adapter.getTokenPrices([token]);
    expect(results[0].status).toBe("fulfilled");
    if (results[0].status === "fulfilled") {
      expect(results[0].price).toBeCloseTo(3.0, 2);
    }
  });

  it("rejects LP when totalSupply is 0", async () => {
    const publicClient = {
      multicall: vi.fn().mockResolvedValue([0n, "0xaaaa", "0xbbbb"]),
    } as unknown as PublicClient;

    const adapter = new BrownFiVaultAdapter({
      publicClient,
      getTokenPrices: createMockGetTokenPrices({}),
    });

    const token = {
      address: "0xd932c344e21ef6C3a94971bf4D4cC71304E2a66C" as `0x${string}`,
      symbol: "BF-V2",
      name: "BrownFi V2",
      decimals: 18,
      chainId: 80094,
    };

    const results = await adapter.getTokenPrices([token]);
    expect(results[0].status).toBe("rejected");
    if (results[0].status === "rejected") {
      expect(results[0].error).toContain("totalSupply is 0");
    }
  });
});
