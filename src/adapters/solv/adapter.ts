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
      {
        address: "0x541FD749419CA806a8bc7da8ac23D346f2dF8B77",
        name: "Solv BTC",
        symbol: "SolvBTC",
        decimals: 18,
        chainId: 80094,
      },
      {
        address: "0xFCBD14DC51f0A4d49d5E53C2E0950e0bC26d0Dce",
        name: "Honey",
        symbol: "HONEY",
        decimals: 18,
        chainId: 80094,
      },
      {
        address: "0xac03CABA51e17c86c921E1f6CBFBdC91F8BB2E6b",
        name: "Infrared BGT",
        symbol: "iBGT",
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
        const isSolvBTCBera =
          token.address.toLowerCase() ===
          "0x0F6f337B09cb5131cF0ce9df3Beb295b8e728F3B".toLowerCase();

        if (isSolvBTCBera) {
          // 1 SolvBTC.BERA = 1 SolvBTC
          const prices = await this.fetchTokenPrice([SOLVBTC], opts);
          const price = prices[0]?.price;
          if (price === undefined) throw new Error("Failed to fetch SolvBTC price");
          return this.fulfilled(token.address, price);
        }

        // Incentive tokens — delegate to external price source
        const prices = await this.fetchTokenPrice([token.address], opts);
        const found = prices.find(
          (p) => p.address.toLowerCase() === token.address.toLowerCase(),
        );
        if (!found) throw new Error(`Price not found for ${token.address}`);
        return this.fulfilled(token.address, found.price);
      }),
    );

    return results.map((r, i) =>
      r.status === "fulfilled"
        ? r.value
        : this.rejected(tokens[i].address, r.reason),
    );
  }
}
