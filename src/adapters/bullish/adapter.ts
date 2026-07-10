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
    ];
  }

  async getTokenPrices(
    tokens: Token[],
    opts?: PriceQueryOptions,
  ): Promise<TokenPriceResult[]> {
    const results = await Promise.allSettled(
      tokens.map(async (token) => {
        // Validate vault is active
        const totalSupply = await this.publicClient.readContract({
          address: token.address,
          abi: totalSupplyAbi,
          functionName: "totalSupply",
          ...(opts?.blockNumber ? { blockNumber: opts.blockNumber } : {}),
        });

        if (totalSupply === 0n) {
          throw new Error(`totalSupply is 0 for ${token.address}`);
        }

        // Bull vault token ≈ BERA price
        const beraPrices = await this.fetchTokenPrice([WBERA], opts);
        const beraPrice = beraPrices.find(
          (p) => p.address.toLowerCase() === WBERA.toLowerCase(),
        )?.price;
        if (beraPrice === undefined) throw new Error("Failed to fetch WBERA price");
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
