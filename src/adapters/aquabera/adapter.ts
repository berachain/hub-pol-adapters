import {
  BasePriceAdapter,
  type Token,
  type TokenPriceResult,
  type PriceQueryOptions,
} from "../../types";
import { uniswapV3PoolAbi } from "../../utils/uniswapV3PoolAbi";

const getTotalAmountsAbi = [
  {
    type: "function",
    name: "getTotalAmounts",
    inputs: [],
    outputs: [
      { internalType: "uint256", name: "total0", type: "uint256" },
      { internalType: "uint256", name: "total1", type: "uint256" },
    ],
    stateMutability: "view",
  },
] as const;

export class AquaBeraAdapter extends BasePriceAdapter {
  readonly name = "AquaBeraAdapter";

  async getTokens(): Promise<Token[]> {
    return [
      {
        address: "0xf9845a03F7e6b06645A03a28b943C8A4B5fE7BCC",
        symbol: "AB-KODIAK-WBERA-BERAMO",
        name: "AquaBera Kodiak wBera Beramo LP Token",
        decimals: 18,
        chainId: 80094,
      },
      {
        address: "0x04fD6a7B02E2e48caedaD7135420604de5f834f8",
        symbol: "AB-KODIAK-WBERA-HENLO",
        name: "AquaBera Kodiak wBera Henlo LP Token",
        decimals: 18,
        chainId: 80094,
      },
      {
        address: "0xb2F776e9c1C926C4b2e54182Fac058dA9Af0B6A5",
        symbol: "HENLO",
        name: "Henlo Token",
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
      tokens.map((token) => this.priceToken(token, opts)),
    );

    return results.map((r, i) =>
      r.status === "fulfilled"
        ? r.value
        : this.rejected(tokens[i].address, r.reason),
    );
  }

  private async priceToken(token: Token, opts?: PriceQueryOptions) {
    const blockNumber = opts?.blockNumber;
    const lpTokens = [
      "0xf9845a03F7e6b06645A03a28b943C8A4B5fE7BCC",
      "0x04fD6a7B02E2e48caedaD7135420604de5f834f8",
    ];

    const isLp = lpTokens.some(
      (lp) => lp.toLowerCase() === token.address.toLowerCase(),
    );

    if (!isLp) {
      // Simple token — delegate to external price source
      const prices = await this.fetchTokenPrice([token.address], opts);
      const found = prices.find(
        (p) => p.address.toLowerCase() === token.address.toLowerCase(),
      );
      if (!found) throw new Error(`Price not found for ${token.address}`);
      return this.fulfilled(token.address, found.price);
    }

    // LP token pricing
    const [totalSupply, [totalAmount0, totalAmount1], token0Addr, token1Addr] =
      await this.publicClient.multicall({
        allowFailure: false,
        contracts: [
          {
            address: token.address,
            abi: uniswapV3PoolAbi,
            functionName: "totalSupply",
          },
          {
            address: token.address,
            abi: getTotalAmountsAbi,
            functionName: "getTotalAmounts",
          },
          {
            address: token.address,
            abi: uniswapV3PoolAbi,
            functionName: "token0",
          },
          {
            address: token.address,
            abi: uniswapV3PoolAbi,
            functionName: "token1",
          },
        ],
        ...(blockNumber ? { blockNumber } : {}),
      });

    if (totalSupply === 0n) {
      throw new Error(`totalSupply is 0 for LP token ${token.address}`);
    }

    const underlyingPrices = await this.fetchTokenPrice(
      [token0Addr, token1Addr].filter(
        (addr, idx, self) =>
          self.findIndex((a) => a.toLowerCase() === addr.toLowerCase()) === idx,
      ),
      opts,
    );

    const price0 = underlyingPrices.find(
      (p) => p.address.toLowerCase() === token0Addr.toLowerCase(),
    )?.price;
    const price1 = underlyingPrices.find(
      (p) => p.address.toLowerCase() === token1Addr.toLowerCase(),
    )?.price;

    if (price0 === undefined) {
      throw new Error(`Price not found for underlying token ${token0Addr}`);
    }
    if (price1 === undefined) {
      throw new Error(`Price not found for underlying token ${token1Addr}`);
    }

    const lpPrice =
      (Number(totalAmount0) * price0 * 1e18 +
        Number(totalAmount1) * price1 * 1e18) /
      Number(totalSupply) /
      1e18;

    return this.fulfilled(token.address, lpPrice);
  }
}
