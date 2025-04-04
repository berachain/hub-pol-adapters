import { BaseAdapter, Token, TokenPrice } from "../../types";
import { fetchPoolData, fetchTokenPrice } from "./hub-api";

export class WberaLBGTVaultAdapter extends BaseAdapter {
  constructor() {
    super({
      name: "WberaLBGTVaultAdapter",
      description:
        "WberaLBGTVaultAdapter is an adapter for the Wbera | LBGT Vault at https://hub.berachain.com/vaults/0xe8ed00b1b142e8d84ef773c4fccaa18682d5a401/",
      enabled: true,
    });
  }

  async getRewardVaultStakingTokens(): Promise<Token[]> {
    return [
      {
        address: "0x705fc16ba5a1eb67051934f2fb17eacae660f6c7",
        name: "WBERA | LBGT",
        symbol: "50WBERA-50LBGT-WEIGHTED",
        decimals: 18,
        chainId: 80094,
      },
    ];
  }

  async getRewardVaultStakingTokenPrices(
    stakingTokens: Token[]
  ): Promise<TokenPrice[]> {
    const poolData = await fetchPoolData(
      stakingTokens.map((token) => token.address)
    );
    return poolData.map((pool) => ({
      address: pool.address,
      price:
        Number(pool.dynamicData.totalLiquidity) /
        Number(pool.dynamicData.totalShares),
      timestamp: Date.now(),
    }));
  }

  async getIncentiveTokens(): Promise<Token[]> {
    return [
      {
        address: "0xbaadcc2962417c01af99fb2b7c75706b9bd6babe",
        name: "Liquid BGT",
        symbol: "LBGT",
        decimals: 18,
        chainId: 80094,
      },
    ];
  }

  async getIncentiveTokenPrices(
    incentiveTokens: Token[]
  ): Promise<TokenPrice[]> {
    const tokenPrices = await fetchTokenPrice(
      incentiveTokens.map((token) => token.address)
    );
    return tokenPrices.map((tokenPrice) => ({
      address: tokenPrice.address,
      price: tokenPrice.price,
      timestamp: tokenPrice.updatedAt,
    }));
  }
}
