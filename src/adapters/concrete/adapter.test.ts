import { describe, it, expect, vi } from "vitest";
import { ConcreteVaultAdapter } from "./adapter";
import {
  createMockGetTokenPrices,
  createFailingGetTokenPrices,
} from "../../test/helpers";
import type { PublicClient } from "viem";

function createConcretePublicClient(
  totalSupply: bigint,
  totalAssets: bigint,
): PublicClient {
  return {
    multicall: vi.fn().mockResolvedValue([totalSupply, totalAssets]),
    readContract: vi.fn(),
  } as unknown as PublicClient;
}

describe("ConcreteVaultAdapter", () => {
  it("returns deduplicated tokens from all vaults", async () => {
    const adapter = new ConcreteVaultAdapter();
    const tokens = await adapter.getTokens();

    // Should have unique tokens only
    const addresses = tokens.map((t) => t.address.toLowerCase());
    const unique = new Set(addresses);
    expect(addresses.length).toBe(unique.size);

    // Should contain both staking and incentive tokens
    expect(tokens.some((t) => t.symbol === "ctBeraBaddiesHONEY")).toBe(true);
    expect(tokens.some((t) => t.symbol === "HONEY")).toBe(true);
  });

  it("prices a funded staking token with totalAssets/totalSupply ratio", async () => {
    // totalAssets = 1.2e18, totalSupply = 1e18 → sharePrice = 1.2
    const publicClient = createConcretePublicClient(
      BigInt(1e18),
      BigInt(1.2e18),
    );

    const adapter = new ConcreteVaultAdapter({
      publicClient,
      getTokenPrices: createMockGetTokenPrices({
        "0xfcbd14dc51f0a4d49d5e53c2e0950e0bc26d0dce": 1.0, // HONEY
      }),
    });

    const stakingToken = {
      address: "0x310532d9d047c5972cd60852c1a4b675edc55fad" as `0x${string}`,
      symbol: "ctBeraBaddiesHONEY",
      name: "Concrete Berabaddies HONEY Vault Token",
      decimals: 18,
      chainId: 80094,
    };

    const results = await adapter.getTokenPrices([stakingToken]);
    expect(results).toHaveLength(1);
    expect(results[0].status).toBe("fulfilled");
    if (results[0].status === "fulfilled") {
      expect(results[0].price).toBeCloseTo(1.2, 5);
    }
  });

  it("returns price 0 for unfunded vault with zero totalSupply", async () => {
    const publicClient = createConcretePublicClient(0n, 0n);

    const adapter = new ConcreteVaultAdapter({
      publicClient,
      getTokenPrices: createMockGetTokenPrices({}),
    });

    // ctBeraETH is unfunded
    const token = {
      address: "0xf59e889f55777cd5a8dddca918500c5d062c8a57" as `0x${string}`,
      symbol: "ctBeraETH",
      name: "Concrete Berachain Ethereum Vault Token",
      decimals: 18,
      chainId: 80094,
    };

    const results = await adapter.getTokenPrices([token]);
    expect(results).toHaveLength(1);
    expect(results[0].status).toBe("fulfilled");
    if (results[0].status === "fulfilled") {
      expect(results[0].price).toBe(0);
    }
  });

  it("rejects funded vault with zero totalSupply", async () => {
    const publicClient = createConcretePublicClient(0n, 0n);

    const adapter = new ConcreteVaultAdapter({
      publicClient,
      getTokenPrices: createMockGetTokenPrices({}),
    });

    // ctBeraBaddiesHONEY is funded
    const token = {
      address: "0x310532d9d047c5972cd60852c1a4b675edc55fad" as `0x${string}`,
      symbol: "ctBeraBaddiesHONEY",
      name: "Concrete Berabaddies HONEY Vault Token",
      decimals: 18,
      chainId: 80094,
    };

    const results = await adapter.getTokenPrices([token]);
    expect(results).toHaveLength(1);
    expect(results[0].status).toBe("rejected");
    if (results[0].status === "rejected") {
      expect(results[0].error).toContain("totalSupply is 0");
    }
  });

  it("prices incentive tokens via external price source", async () => {
    const adapter = new ConcreteVaultAdapter({
      publicClient: {} as PublicClient,
      getTokenPrices: createMockGetTokenPrices({
        "0xfcbd14dc51f0a4d49d5e53c2e0950e0bc26d0dce": 1.01,
      }),
    });

    const token = {
      address: "0xFCBD14DC51f0A4d49d5E53C2E0950e0bC26d0Dce" as `0x${string}`,
      symbol: "HONEY",
      name: "Honey (HONEY)",
      decimals: 18,
      chainId: 80094,
    };

    const results = await adapter.getTokenPrices([token]);
    expect(results).toHaveLength(1);
    expect(results[0].status).toBe("fulfilled");
    if (results[0].status === "fulfilled") {
      expect(results[0].price).toBeCloseTo(1.01);
    }
  });

  it("isolates errors: one token fails, others succeed", async () => {
    let callCount = 0;
    const publicClient = {
      multicall: vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First staking token succeeds
          return Promise.resolve([BigInt(1e18), BigInt(1.5e18)]);
        }
        // Second staking token fails
        return Promise.reject(new Error("RPC timeout"));
      }),
    } as unknown as PublicClient;

    const adapter = new ConcreteVaultAdapter({
      publicClient,
      getTokenPrices: createMockGetTokenPrices({
        "0xfcbd14dc51f0a4d49d5e53c2e0950e0bc26d0dce": 1.0,
        "0x6969696969696969696969696969696969696969": 5.0,
      }),
    });

    const tokens = [
      {
        address: "0x310532d9d047c5972cd60852c1a4b675edc55fad" as `0x${string}`,
        symbol: "ctBeraBaddiesHONEY",
        name: "test",
        decimals: 18,
        chainId: 80094,
      },
      {
        address: "0x6e0a95f6ac86ead002d58c83fc1b5a712ee9be7c" as `0x${string}`,
        symbol: "ctBeraBaddiesWBERA",
        name: "test",
        decimals: 18,
        chainId: 80094,
      },
    ];

    const results = await adapter.getTokenPrices(tokens);
    expect(results).toHaveLength(2);
    expect(results[0].status).toBe("fulfilled");
    expect(results[1].status).toBe("rejected");
    if (results[1].status === "rejected") {
      expect(results[1].error).toContain("RPC timeout");
    }
  });

  it("passes blockNumber to multicall for historical queries", async () => {
    const multicallMock = vi.fn().mockResolvedValue([BigInt(1e18), BigInt(2e18)]);
    const publicClient = {
      multicall: multicallMock,
    } as unknown as PublicClient;

    const adapter = new ConcreteVaultAdapter({
      publicClient,
      getTokenPrices: createMockGetTokenPrices({
        "0xfcbd14dc51f0a4d49d5e53c2e0950e0bc26d0dce": 1.0,
      }),
    });

    const token = {
      address: "0x310532d9d047c5972cd60852c1a4b675edc55fad" as `0x${string}`,
      symbol: "ctBeraBaddiesHONEY",
      name: "test",
      decimals: 18,
      chainId: 80094,
    };

    await adapter.getTokenPrices([token], { blockNumber: 12345678n });

    expect(multicallMock).toHaveBeenCalledWith(
      expect.objectContaining({ blockNumber: 12345678n }),
    );
  });
});
