import {
  BasePriceAdapter,
  type Token,
  type TokenPriceResult,
  type PriceQueryOptions,
} from "../../types";

const WBERA = "0x6969696969696969696969696969696969696969";

const totalSupplyAbi = [
  {
    type: "function",
    name: "totalSupply",
    inputs: [],
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
  },
] as const;

export class BullIshGaugeAdapter extends BasePriceAdapter {
  readonly name = "BullIshGaugeAdapter";

  async getTokens(): Promise<Token[]> {
    return [
      {
        address: "0xdDD3Ea5De9c70973E224D938B8f392EC4CC0171C",
        symbol: "BULL-VAULT",
        name: "Bull Ish Vault Token",
        decimals: 18,
        chainId: 80094,
      },
      {
        address: "0x9b6761bf2397Bb5a6624a856cC84A3A14Dcd3fe5",
        symbol: "iBERA",
        name: "Infrared Bera",
        decimals: 18,
        chainId: 80094,
      },
      {
        address: "0xD77552D3849ab4D8C3b189A9582d0ba4C1F4f912",
        symbol: "wgBERA",
        name: "Wrapped gBERA",
        decimals: 18,
        chainId: 80094,
      },
      {
        address: "0x6969696969696969696969696969696969696969",
        symbol: "WBERA",
        name: "Wrapped BERA",
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
        const isBullVault =
          token.address.toLowerCase() ===
          "0xdDD3Ea5De9c70973E224D938B8f392EC4CC0171C".toLowerCase();

        if (isBullVault) {
          // Validate vault is active
          const totalSupply = await this.publicClient.readContract({
            address: token.address,
            abi: totalSupplyAbi,
            functionName: "totalSupply",
            ...(opts?.blockNumber ? { blockNumber: opts.blockNumber } : {}),
          });

          if (totalSupply === 0n) {
            throw new Error(
              `totalSupply is 0 for ${token.address}`,
            );
          }

          // Bull vault token ≈ BERA price
          const beraPrices = await this.fetchTokenPrice([WBERA], opts);
          const beraPrice = beraPrices[0]?.price;
          if (beraPrice === undefined) throw new Error("Failed to fetch WBERA price");
          return this.fulfilled(token.address, beraPrice);
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
