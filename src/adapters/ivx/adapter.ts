import { erc20Abi } from "viem";
import {
  BasePriceAdapter,
  type Token,
  type TokenPriceResult,
  type PriceQueryOptions,
} from "../../types";

const totalSupplyAbi = [
  {
    type: "function",
    name: "totalSupply",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
] as const;

interface SupportedToken {
  readonly address: `0x${string}`;
  readonly decimals: number;
}

const IVX_SUPPORTED_TOKENS: SupportedToken[] = [
  { address: "0xFCBD14DC51f0A4d49d5E53C2E0950e0bC26d0Dce", decimals: 18 }, // HONEY
  { address: "0x6969696969696969696969696969696969696969", decimals: 18 }, // WBERA
  { address: "0x2F6F07CDcf3588944Bf4C42aC74ff24bF56e7590", decimals: 18 }, // WETH
  { address: "0x0555E30da8f98308EdB960aa94C0Db47230d2B9c", decimals: 8 }, // WBTC
];

const IVLP_VAULT = "0x598eE20d8D372665a96AFba9d3B0Bfd817f1f340" as const;

export class IVXVaultAdapter extends BasePriceAdapter {
  readonly name = "IVXVaultAdapter";

  async getTokens(): Promise<Token[]> {
    return [
      {
        address: "0x3b8B155E3C44f07f6EAd507570f4047C8B450A7F",
        symbol: "IVLP",
        name: "IVX Liquidity pool token",
        decimals: 18,
        chainId: 80094,
      },
      {
        address: "0xFCBD14DC51f0A4d49d5E53C2E0950e0bC26d0Dce",
        symbol: "HONEY",
        name: "Honey",
        decimals: 18,
        chainId: 80094,
      },
      {
        address: "0x6969696969696969696969696969696969696969",
        symbol: "WBERA",
        name: "Wrapped Bera",
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
        const isIVLP =
          token.address.toLowerCase() ===
          "0x3b8B155E3C44f07f6EAd507570f4047C8B450A7F".toLowerCase();

        if (isIVLP) {
          return this.priceIVLP(token, opts);
        }

        // Incentive tokens
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

  private async priceIVLP(token: Token, opts?: PriceQueryOptions) {
    const blockNumber = opts?.blockNumber;
    const addresses = IVX_SUPPORTED_TOKENS.map((t) => t.address);

    // Fetch prices for all supported tokens
    const tokenPricesRaw = await this.fetchTokenPrice(addresses, opts);
    const priceMap = new Map(
      tokenPricesRaw.map((p) => [p.address.toLowerCase(), p.price]),
    );

    // Fetch balances of supported tokens in the vault
    const balances = await this.publicClient.multicall({
      allowFailure: false,
      contracts: addresses.map(
        (addr) =>
          ({
            address: addr,
            abi: erc20Abi,
            functionName: "balanceOf",
            args: [IVLP_VAULT],
          }) as const,
      ),
      ...(blockNumber ? { blockNumber } : {}),
    });

    // Fetch IVLP total supply
    const totalSupply = await this.publicClient.readContract({
      address: token.address,
      abi: totalSupplyAbi,
      functionName: "totalSupply",
      ...(blockNumber ? { blockNumber } : {}),
    });

    // Calculate TVL
    let tvl = 0;
    for (let i = 0; i < IVX_SUPPORTED_TOKENS.length; i++) {
      const price = priceMap.get(IVX_SUPPORTED_TOKENS[i].address.toLowerCase());
      if (price === undefined) {
        throw new Error(
          `Price not found for token: ${IVX_SUPPORTED_TOKENS[i].address}`,
        );
      }
      tvl +=
        (Number(balances[i]) * price) /
        10 ** IVX_SUPPORTED_TOKENS[i].decimals;
    }

    const totalSupplyDecimal = Number(totalSupply) / 1e18;
    if (totalSupplyDecimal === 0) {
      throw new Error(`totalSupply is 0 for IVLP token ${token.address}`);
    }

    return this.fulfilled(token.address, tvl / totalSupplyDecimal);
  }
}
