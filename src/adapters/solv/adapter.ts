import {
  BasePriceAdapter,
  type Token,
  type TokenPriceResult,
  type PriceQueryOptions,
} from "../../types";

const SOLVBTC = "0x541FD749419CA806a8bc7da8ac23D346f2dF8B77";

export class SolvBTCBeraVaultAdapter extends BasePriceAdapter {
  readonly name = "SolvBTCBeraVaultAdapter";

  async getTokens(): Promise<Token[]> {
    return [
      {
        address: "0x0F6f337B09cb5131cF0ce9df3Beb295b8e728F3B",
        symbol: "SolvBTC.BERA",
        name: "SolvBTC Bera Vault",
        decimals: 18,
        chainId: 80094,
      },
    ];
  }

  async getTokenPrices(
    tokens: Token[],
    opts?: PriceQueryOptions,
  ): Promise<TokenPriceResult[]> {
    const results = await Promise.allSettled(
      tokens.map(async (token) => {
        // 1 SolvBTC.BERA = 1 SolvBTC
        const prices = await this.fetchTokenPrice([SOLVBTC], opts);
        const price = prices.find(
          (p) => p.address.toLowerCase() === SOLVBTC.toLowerCase(),
        )?.price;
        if (price === undefined) throw new Error("Failed to fetch SolvBTC price");
        return this.fulfilled(token.address, price);
      }),
    );

    return results.map((r, i) =>
      r.status === "fulfilled"
        ? r.value
        : this.rejected(tokens[i].address, r.reason),
    );
  }
}
