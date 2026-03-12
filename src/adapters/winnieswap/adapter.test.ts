import { describe, it, expect, vi, beforeEach } from "vitest";
import { WinnieSwapAdapter } from "./adapter";
import { createMockGetTokenPrices } from "../../test/helpers";
import type { PublicClient } from "viem";

// Mock global fetch for WinnieSwap GraphQL
const mockFetch = vi.fn();

describe("WinnieSwapAdapter", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
    mockFetch.mockReset();
  });

  it("discovers tokens dynamically from GraphQL", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            stickyVaults: {
              items: [
                {
                  id: "0xvault1",
                  name: "WBERA-HONEY Vault",
                  pool: "0xpool1",
                  poolRef: {
                    token0Ref: { symbol: "WBERA" },
                    token1Ref: { symbol: "HONEY" },
                    feeTier: 3000,
                  },
                },
                {
                  id: "0xvault2",
                  name: "WETH-USDC Vault",
                  pool: "0xpool2",
                  poolRef: {
                    token0Ref: { symbol: "WETH" },
                    token1Ref: { symbol: "USDC" },
                    feeTier: 500,
                  },
                },
              ],
            },
          },
        }),
    });

    const adapter = new WinnieSwapAdapter();
    const tokens = await adapter.getTokens();

    expect(tokens).toHaveLength(2);
    expect(tokens[0].symbol).toBe("WBERA-HONEY-3000");
    expect(tokens[1].symbol).toBe("WETH-USDC-500");
    expect(tokens[0].address).toBe("0xvault1");
  });

  it("prices LP tokens using on-chain data", async () => {
    const token0Addr = "0xaaaa";
    const token1Addr = "0xbbbb";

    const publicClient = {
      multicall: vi.fn().mockResolvedValue([
        BigInt(100e18), // totalSupply
        token0Addr,
        token1Addr,
        [BigInt(50e18), BigInt(200e18)], // underlyingBalances
      ]),
    } as unknown as PublicClient;

    // Need to mock fetch for getTokens but we'll pass tokens directly
    const adapter = new WinnieSwapAdapter({
      publicClient,
      getTokenPrices: createMockGetTokenPrices({
        "0xaaaa": 5.0,
        "0xbbbb": 0.5,
      }),
    });

    const token = {
      address: "0xvault1" as `0x${string}`,
      symbol: "WBERA-HONEY-3000",
      name: "test",
      decimals: 18,
      chainId: 80094,
    };

    const results = await adapter.getTokenPrices([token]);
    expect(results[0].status).toBe("fulfilled");
    if (results[0].status === "fulfilled") {
      // (50e18 * 5 + 200e18 * 0.5) / 100e18 = 3.5
      expect(results[0].price).toBeCloseTo(3.5, 5);
    }
  });

  it("returns price 0 for vault with zero totalSupply", async () => {
    const publicClient = {
      multicall: vi.fn().mockResolvedValue([
        0n,
        "0xaaaa",
        "0xbbbb",
        [0n, 0n],
      ]),
    } as unknown as PublicClient;

    const adapter = new WinnieSwapAdapter({
      publicClient,
      getTokenPrices: createMockGetTokenPrices({}),
    });

    const token = {
      address: "0xvault1" as `0x${string}`,
      symbol: "test",
      name: "test",
      decimals: 18,
      chainId: 80094,
    };

    const results = await adapter.getTokenPrices([token]);
    expect(results[0].status).toBe("fulfilled");
    if (results[0].status === "fulfilled") {
      expect(results[0].price).toBe(0);
    }
  });

  it("rejects when underlying price is missing", async () => {
    const publicClient = {
      multicall: vi.fn().mockResolvedValue([
        BigInt(100e18),
        "0xaaaa",
        "0xbbbb",
        [BigInt(50e18), BigInt(200e18)],
      ]),
    } as unknown as PublicClient;

    const adapter = new WinnieSwapAdapter({
      publicClient,
      getTokenPrices: createMockGetTokenPrices({
        "0xaaaa": 5.0,
        // 0xbbbb price is missing
      }),
    });

    const token = {
      address: "0xvault1" as `0x${string}`,
      symbol: "test",
      name: "test",
      decimals: 18,
      chainId: 80094,
    };

    const results = await adapter.getTokenPrices([token]);
    expect(results[0].status).toBe("rejected");
    if (results[0].status === "rejected") {
      expect(results[0].error).toContain("Price not found");
    }
  });
});
