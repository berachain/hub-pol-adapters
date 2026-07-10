import { erc20Abi, formatUnits } from "viem";
import {
  BasePriceAdapter,
  type Token,
  type TokenPriceResult,
  type PriceQueryOptions,
} from "../../types";
import { uniswapV3PoolAbi } from "../../utils/uniswapV3PoolAbi";

export class BrownFiVaultAdapter extends BasePriceAdapter {
  readonly name = "BrownFiVaultAdapter";

  async getTokens(): Promise<Token[]> {
    return [
      {
        address: "0xd932c344e21ef6C3a94971bf4D4cC71304E2a66C",
        name: "BrownFi V2",
        symbol: "BF-V2",
        decimals: 18,
        chainId: 80094,
      },
      {
        address: "0xd57Da672354905B9E42Df077Df77E554dC5Fd1Cc",
        name: "BrownFi V2",
        symbol: "BF-V2",
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
      tokens.map((token) => this.priceLpToken(token, opts)),
    );

    return results.map((r, i) =>
      r.status === "fulfilled"
        ? r.value
        : this.rejected(tokens[i].address, r.reason),
    );
  }

  private async priceLpToken(token: Token, opts?: PriceQueryOptions) {
    const blockNumber = opts?.blockNumber;

    // First multicall: totalSupply, token0, token1
    const [totalSupply, token0Addr, token1Addr] =
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

    // Second multicall: balances and decimals
    const [token0Amount, token1Amount, token0Decimals, token1Decimals] =
      await this.publicClient.multicall({
        allowFailure: false,
        contracts: [
          {
            address: token0Addr,
            abi: erc20Abi,
            functionName: "balanceOf",
            args: [token.address],
          },
          {
            address: token1Addr,
            abi: erc20Abi,
            functionName: "balanceOf",
            args: [token.address],
          },
          {
            address: token0Addr,
            abi: erc20Abi,
            functionName: "decimals",
          },
          {
            address: token1Addr,
            abi: erc20Abi,
            functionName: "decimals",
          },
        ],
        ...(blockNumber ? { blockNumber } : {}),
      });

    if (totalSupply === 0n) {
      throw new Error(`totalSupply is 0 for LP token ${token.address}`);
    }

    // Fetch underlying token prices
    const tokenPrices = await this.fetchTokenPrice(
      [token0Addr, token1Addr],
      opts,
    );

    const price0 = tokenPrices.find(
      (p) => p.address.toLowerCase() === token0Addr.toLowerCase(),
    )?.price;
    const price1 = tokenPrices.find(
      (p) => p.address.toLowerCase() === token1Addr.toLowerCase(),
    )?.price;

    if (price0 === undefined || price1 === undefined) {
      throw new Error(
        `Price not found for underlying tokens ${token0Addr} or ${token1Addr}`,
      );
    }

    const lpPrice =
      (Number(formatUnits(token0Amount, token0Decimals)) * price0 +
        Number(formatUnits(token1Amount, token1Decimals)) * price1) /
      Number(formatUnits(totalSupply, token.decimals));

    return this.fulfilled(token.address, lpPrice);
  }
}
