import { describe, it, expect } from "vitest";
import { SolvBTCBeraVaultAdapter } from "./adapter";
import {
  createMockPublicClient,
  createMockGetTokenPrices,
} from "../../test/helpers";

const SOLVBTC = "0x541fd749419ca806a8bc7da8ac23d346f2df8b77";

describe("SolvBTCBeraVaultAdapter", () => {
  it("returns all tokens", async () => {
    const adapter = new SolvBTCBeraVaultAdapter();
    const tokens = await adapter.getTokens();
    expect(tokens.length).toBe(1);
    expect(tokens[0].symbol).toBe("SolvBTC.BERA");
  });

  it("prices SolvBTC.BERA at SolvBTC price (1:1)", async () => {
    const adapter = new SolvBTCBeraVaultAdapter({
      publicClient: createMockPublicClient(),
      getTokenPrices: createMockGetTokenPrices({
        [SOLVBTC]: 62000,
      }),
    });

    const token = {
      address: "0x0F6f337B09cb5131cF0ce9df3Beb295b8e728F3B" as `0x${string}`,
      symbol: "SolvBTC.BERA",
      name: "test",
      decimals: 18,
      chainId: 80094,
    };

    const results = await adapter.getTokenPrices([token]);
    expect(results[0].status).toBe("fulfilled");
    if (results[0].status === "fulfilled") {
      expect(results[0].price).toBe(62000);
    }
  });
});
