import { describe, it, expect, vi } from "vitest";
import { IVXVaultAdapter } from "./adapter";
import { createMockGetTokenPrices } from "../../test/helpers";
import type { PublicClient } from "viem";

describe("IVXVaultAdapter", () => {
  it("returns IVLP and incentive tokens", async () => {
    const adapter = new IVXVaultAdapter();
    const tokens = await adapter.getTokens();
    expect(tokens.length).toBe(3);
    expect(tokens[0].symbol).toBe("IVLP");
  });

  it("prices IVLP based on TVL / totalSupply", async () => {
    // 4 supported tokens with balances and prices:
    // HONEY: balance 100e18, price 1.0 → value 100
    // WBERA: balance 50e18, price 5.0 → value 250
    // WETH: balance 1e18, price 2000 → value 2000
    // WBTC: balance 0.1e8 (8 decimals), price 60000 → value 6000
    // TVL = 8350
    // totalSupply = 1000e18 → price = 8.35

    const publicClient = {
      multicall: vi.fn().mockResolvedValue([
        BigInt(100e18),
        BigInt(50e18),
        BigInt(1e18),
        BigInt(0.1e8),
      ]),
      readContract: vi.fn().mockResolvedValue(BigInt(1000e18)),
    } as unknown as PublicClient;

    const adapter = new IVXVaultAdapter({
      publicClient,
      getTokenPrices: createMockGetTokenPrices({
        "0xfcbd14dc51f0a4d49d5e53c2e0950e0bc26d0dce": 1.0, // HONEY
        "0x6969696969696969696969696969696969696969": 5.0, // WBERA
        "0x2f6f07cdcf3588944bf4c42ac74ff24bf56e7590": 2000, // WETH
        "0x0555e30da8f98308edb960aa94c0db47230d2b9c": 60000, // WBTC
      }),
    });

    const token = {
      address: "0x3b8B155E3C44f07f6EAd507570f4047C8B450A7F" as `0x${string}`,
      symbol: "IVLP",
      name: "IVX LP",
      decimals: 18,
      chainId: 80094,
    };

    const results = await adapter.getTokenPrices([token]);
    expect(results[0].status).toBe("fulfilled");
    if (results[0].status === "fulfilled") {
      expect(results[0].price).toBeCloseTo(8.35, 2);
    }
  });

  it("isolates IVLP failure from incentive token pricing", async () => {
    const publicClient = {
      multicall: vi.fn().mockRejectedValue(new Error("RPC error")),
      readContract: vi.fn().mockRejectedValue(new Error("RPC error")),
    } as unknown as PublicClient;

    const adapter = new IVXVaultAdapter({
      publicClient,
      getTokenPrices: createMockGetTokenPrices({
        "0xfcbd14dc51f0a4d49d5e53c2e0950e0bc26d0dce": 1.0,
      }),
    });

    const tokens = [
      {
        address: "0x3b8B155E3C44f07f6EAd507570f4047C8B450A7F" as `0x${string}`,
        symbol: "IVLP",
        name: "IVX LP",
        decimals: 18,
        chainId: 80094,
      },
      {
        address: "0xFCBD14DC51f0A4d49d5E53C2E0950e0bC26d0Dce" as `0x${string}`,
        symbol: "HONEY",
        name: "Honey",
        decimals: 18,
        chainId: 80094,
      },
    ];

    const results = await adapter.getTokenPrices(tokens);
    expect(results[0].status).toBe("rejected");
    expect(results[1].status).toBe("fulfilled");
  });
});
