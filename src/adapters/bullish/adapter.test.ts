import { describe, it, expect, vi } from "vitest";
import { BullIshGaugeAdapter } from "./adapter";
import { createMockGetTokenPrices } from "../../test/helpers";
import type { PublicClient } from "viem";

const WBERA = "0x6969696969696969696969696969696969696969";

describe("BullIshGaugeAdapter", () => {
  it("returns all tokens (staking + incentive)", async () => {
    const adapter = new BullIshGaugeAdapter();
    const tokens = await adapter.getTokens();
    expect(tokens.length).toBe(4);
    expect(tokens[0].symbol).toBe("BULL-VAULT");
  });

  it("prices BULL-VAULT at WBERA price when totalSupply > 0", async () => {
    const publicClient = {
      readContract: vi.fn().mockResolvedValue(BigInt(1e18)),
      multicall: vi.fn(),
    } as unknown as PublicClient;

    const adapter = new BullIshGaugeAdapter({
      publicClient,
      getTokenPrices: createMockGetTokenPrices({
        [WBERA]: 5.5,
        "0x9b6761bf2397bb5a6624a856cc84a3a14dcd3fe5": 6.0,
      }),
    });

    const tokens = await adapter.getTokens();
    const results = await adapter.getTokenPrices(tokens);

    // BULL-VAULT should be priced at WBERA
    const bullResult = results.find(
      (r) =>
        r.address.toLowerCase() ===
        "0xdDD3Ea5De9c70973E224D938B8f392EC4CC0171C".toLowerCase(),
    );
    expect(bullResult?.status).toBe("fulfilled");
    if (bullResult?.status === "fulfilled") {
      expect(bullResult.price).toBe(5.5);
    }
  });

  it("rejects BULL-VAULT when totalSupply is 0", async () => {
    const publicClient = {
      readContract: vi.fn().mockResolvedValue(0n),
    } as unknown as PublicClient;

    const adapter = new BullIshGaugeAdapter({
      publicClient,
      getTokenPrices: createMockGetTokenPrices({ [WBERA]: 5.5 }),
    });

    const token = {
      address: "0xdDD3Ea5De9c70973E224D938B8f392EC4CC0171C" as `0x${string}`,
      symbol: "BULL-VAULT",
      name: "test",
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
