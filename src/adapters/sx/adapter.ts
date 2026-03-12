import {
  BasePriceAdapter,
  type Token,
  type TokenPriceResult,
  type PriceQueryOptions,
} from "../../types";

const WBERA = "0x6969696969696969696969696969696969696969";

export class SxVaultAdapter extends BasePriceAdapter {
  readonly name = "SxVaultAdapter";

  async getTokens(): Promise<Token[]> {
    return [
      {
        address: "0xe87e5456cc78578d1fcd95048fa639e5e32ee63a",
        symbol: "SXBRT",
        name: "SX Bera Token (SXBRT)",
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
    ];
  }

  async getTokenPrices(
    tokens: Token[],
    opts?: PriceQueryOptions,
  ): Promise<TokenPriceResult[]> {
    const results = await Promise.allSettled(
      tokens.map(async (token) => {
        // 1 SXBRT = 1 BGT ≈ WBERA price
        const beraPrices = await this.fetchTokenPrice([WBERA], opts);
        const beraPrice = beraPrices[0]?.price;

        if (beraPrice === undefined) {
          throw new Error("Failed to fetch WBERA price");
        }

        return this.fulfilled(token.address, beraPrice);
      }),
    );

    return results.map((r, i) =>
      r.status === "fulfilled"
        ? r.value
        : this.rejected(tokens[i].address, r.reason),
    );
  }
}
