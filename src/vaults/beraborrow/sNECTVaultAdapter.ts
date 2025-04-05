import { BaseAdapter, Token, TokenPrice } from "../../types";
import { fetchPoolData, fetchTokenPrice } from "./hub-api";

export class sNECTVaultAdapter extends BaseAdapter {
  constructor() {
    super({
      name: "sNECTVaultAdapter",
      description:
        "sNECTVaultAdapter is an adapter for the sNECT Vault at https://hub.berachain.com/vaults/0x1161e6a6600c08c21cff7ac689e781b41db56d85/",
      enabled: true,
    });
  }

  async getRewardVaultStakingTokens(): Promise<Token[]> {
    return [
      {
        address: "0x597877Ccf65be938BD214C4c46907669e3E62128",
        symbol: "sNECT",
        name: "Staked Nectar (sNECT)",
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
        Number(pool.dynamicData.totalAssets) /
        Number(pool.dynamicData.totalSupply),
      timestamp: Date.now(),
    }));
  }


   async getIncentiveTokens(): Promise<Token[]> {
    return [
      {
        address: "0x1cE0a25D13CE4d52071aE7e02Cf1F6606F4C79d3",
        name: "Nectar",
        symbol: "NECT",
        decimals: 18,
        chainId: 80094,
      },
    ];
  }
}
