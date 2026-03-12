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
      {
        address: "0x549943e04f40284185054145c6E4e9568C1D3241",
        name: "Bridged USDC (Stargate) (USDC.e)",
        symbol: "USDC.e",
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
    const lpAddresses = [
      "0xd932c344e21ef6C3a94971bf4D4cC71304E2a66C",
      "0xd57Da672354905B9E42Df077Df77E554dC5Fd1Cc",
    ];

    const results = await Promise.allSettled(
      tokens.map(async (token) => {
        const isLp = lpAddresses.some(
          (lp) => lp.toLowerCase() === token.address.toLowerCase(),
        );

        if (isLp) {
          return this.priceLpToken(token, opts);
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
