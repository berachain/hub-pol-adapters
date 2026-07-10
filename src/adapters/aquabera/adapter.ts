import { erc20Abi, formatUnits } from "viem";
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

    // LP token pricing
    const [totalSupply, [totalAmount0, totalAmount1,], token0Addr, token1Addr] =
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

    const [token0Decimals, token1Decimals] = await this.publicClient.multicall({
      allowFailure: false,
      contracts: [
        { address: token0Addr, abi: erc20Abi, functionName: "decimals" },
        { address: token1Addr, abi: erc20Abi, functionName: "decimals" },
      ],
      ...(blockNumber ? { blockNumber } : {}),
    });

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
      (Number(formatUnits(totalAmount0, token0Decimals)) * price0 +
        Number(formatUnits(totalAmount1, token1Decimals)) * price1) /
      Number(formatUnits(totalSupply, token.decimals));

    return this.fulfilled(token.address, lpPrice);
  }
}
