import { describe, it, expect, vi } from "vitest";
import { AquaBeraAdapter } from "./adapter";
import { createMockGetTokenPrices } from "../../test/helpers";
import type { PublicClient } from "viem";

const WBERA = "0x6969696969696969696969696969696969696969";
const BERAMO = "0xberamo";
const HENLO_ADDR = "0xb2f776e9c1c926c4b2e54182fac058da9af0b6a5";

describe("AquaBeraAdapter", () => {
  it("returns both LP and incentive tokens", async () => {
    const adapter = new AquaBeraAdapter();
    const tokens = await adapter.getTokens();
    expect(tokens.length).toBe(4);
    expect(tokens.some((t) => t.symbol === "AB-KODIAK-WBERA-BERAMO")).toBe(true);
    expect(tokens.some((t) => t.symbol === "HENLO")).toBe(true);
    expect(tokens.some((t) => t.symbol === "WBERA")).toBe(true);
  });

  it("prices LP token correctly from on-chain data", async () => {
    // totalSupply = 100e18, totalAmount0 = 50e18 (price 5.0), totalAmount1 = 200e18 (price 0.5)
    // expected LP price = (50e18 * 5 + 200e18 * 0.5) / 100e18 = (250 + 100) / 100 = 3.5
    const token0 = "0xaaaa";
    const token1 = "0xbbbb";

    const publicClient = {
      multicall: vi.fn().mockResolvedValue([
        BigInt(100e18), // totalSupply
        [BigInt(50e18), BigInt(200e18)], // getTotalAmounts
        token0,
        token1,
      ]),
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

  it("prices non-LP tokens via external price source", async () => {
    const adapter = new AquaBeraAdapter({
      publicClient: {} as PublicClient,
      getTokenPrices: createMockGetTokenPrices({
        [HENLO_ADDR]: 0.001,
      }),
    });

    const token = {
      address: "0xb2F776e9c1C926C4b2e54182Fac058dA9Af0B6A5" as `0x${string}`,
      symbol: "HENLO",
      name: "Henlo",
      decimals: 18,
      chainId: 80094,
    };

    const results = await adapter.getTokenPrices([token]);
    expect(results[0].status).toBe("fulfilled");
    if (results[0].status === "fulfilled") {
      expect(results[0].price).toBeCloseTo(0.001);
    }
  });

  it("isolates errors between LP and non-LP tokens", async () => {
    const publicClient = {
      multicall: vi.fn().mockRejectedValue(new Error("RPC fail")),
    } as unknown as PublicClient;

    const adapter = new AquaBeraAdapter({
      publicClient,
      getTokenPrices: createMockGetTokenPrices({
        [HENLO_ADDR]: 0.001,
      }),
    });

    const tokens = [
      {
        address: "0xf9845a03F7e6b06645A03a28b943C8A4B5fE7BCC" as `0x${string}`,
        symbol: "AB-KODIAK-WBERA-BERAMO",
        name: "LP",
        decimals: 18,
        chainId: 80094,
      },
      {
        address: "0xb2F776e9c1C926C4b2e54182Fac058dA9Af0B6A5" as `0x${string}`,
        symbol: "HENLO",
        name: "Henlo",
        decimals: 18,
        chainId: 80094,
      },
    ];

    const results = await adapter.getTokenPrices(tokens);
    expect(results).toHaveLength(2);
    expect(results[0].status).toBe("rejected"); // LP failed
    expect(results[1].status).toBe("fulfilled"); // HENLO succeeded
  });
});
