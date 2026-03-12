import {
  BasePriceAdapter,
  type Token,
  type TokenPriceResult,
  type PriceQueryOptions,
} from "../../types";
import { uniswapV3PoolAbi } from "../../utils/uniswapV3PoolAbi";

const WINNIESWAP_GRAPHQL_URL = "https://sub.winnieswap.com/";

interface StickyVaultData {
  id: string;
  name: string;
  pool: string;
  poolRef: {
    token0Ref: { symbol: string };
    token1Ref: { symbol: string };
    feeTier: number;
  };
}

const VAULTS_QUERY = `
  query GetStickyVaults {
    stickyVaults {
      items {
        id
        name
        pool
        poolRef {
          token0Ref { symbol }
          token1Ref { symbol }
          feeTier
        }
      }
    }
  }
`;

const getUnderlyingBalancesAbi = [
  {
    type: "function",
    name: "getUnderlyingBalances",
    inputs: [],
    outputs: [
      { internalType: "uint256", name: "amount0Current", type: "uint256" },
      { internalType: "uint256", name: "amount1Current", type: "uint256" },
    ],
    stateMutability: "view",
  },
] as const;

export class WinnieSwapAdapter extends BasePriceAdapter {
  readonly name = "WinnieSwapAdapter";

  async getTokens(): Promise<Token[]> {
    const response = await fetch(WINNIESWAP_GRAPHQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: VAULTS_QUERY }),
    });

    if (!response.ok) {
      throw new Error(`WinnieSwap API error: HTTP ${response.status}`);
    }

    const data = await response.json();
    const vaults: StickyVaultData[] = data.data?.stickyVaults?.items ?? [];

    return vaults.map((vault) => ({
      address: vault.id.toLowerCase() as `0x${string}`,
      symbol: `${vault.poolRef.token0Ref.symbol}-${vault.poolRef.token1Ref.symbol}-${vault.poolRef.feeTier}`,
      name: vault.name,
      decimals: 18,
      chainId: 80094,
    }));
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

    const [totalSupply, token0Addr, token1Addr, [totalAmount0, totalAmount1]] =
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
          {
            address: token.address,
            abi: getUnderlyingBalancesAbi,
            functionName: "getUnderlyingBalances",
          },
        ],
        ...(blockNumber ? { blockNumber } : {}),
      });

    if (totalSupply === 0n) {
      return this.fulfilled(token.address, 0);
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
