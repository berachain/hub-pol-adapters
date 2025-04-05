import { BaseAdapter, Token, TokenPrice } from "../../types";

export class YourProtocolAdapter extends BaseAdapter {
  constructor(config: {
       name: "sNECTVaultAdapter",
      description:
        "sNECTVaultAdapter is an adapter for the sNECT Vault at https://hub.berachain.com/vaults/0x1161e6a6600c08c21cff7ac689e781b41db56d85/",
      enabled: true,
  }) {
    super(config);
  }

  /**
   * Get staking tokens from reward vaults
   * These tokens are used to calculate TVL for APR calculations
   */
  async getRewardVaultStakingTokens(): Promise<Token[]> {
    // Implement to return staking tokens
    // Example:
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

  /**
   * Get prices for staking tokens
   * These prices are used to calculate TVL for APR calculations
   */
async getRewardVaultStakingTokenPrices(
  stakingTokens: Token[]
): Promise<TokenPrice[]> {
  const multicallAddress = this.secrets.getSecret('networkConfig').multiCall; // Assuming you have access to this

  const prices = await Promise.all(
    stakingTokens.map(async (token) => {
      const lspPrice = await multicall({
        contracts: [
          {
            address: token.address,
            abi: [
              {
                type: 'function',
                name: 'totalSupply',
                inputs: [],
                outputs: [{ name: '', type: 'uint256' }],
                stateMutability: 'view',
              },
            ],
            functionName: 'totalSupply',
          },
          {
            address: token.address,
            abi: [
              {
                type: 'function',
                name: 'totalAssets',
                inputs: [],
                outputs: [{ name: '', type: 'uint256' }],
                stateMutability: 'view',
              },
            ],
            functionName: 'totalAssets',
          },
        ],
        multicallAddress: multicallAddress,
      });

      const [totalSupply, totalAssets] = lspPrice;
      
      if (totalSupply === 0n) throw new Error(`Failed to fetch LSP data for ${token.address}: totalSupply is 0`);
      
      const price = (totalAssets * BigInt(1e18)) / totalSupply;

      return {
        address: token.address,
        price: Number(price) / 1e18, // Convert from bigint to number and adjust decimals
        timestamp: Date.now(),
      };
    })
  );

  return prices;
}

  /**
   * Get incentive/reward tokens
   * These tokens are used to calculate reward value for APR calculations
   */
  async getIncentiveTokens(): Promise<Token[]> {
    // Implement to return incentive tokens
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

  /**
   * Get prices for incentive tokens
   * These prices are used to calculate reward value for APR calculations
   *
   * Note: You don't need to implement this if your token is already listed on Hub or Kodiak,
   * or if it's tracked by Coingecko (in which case, add it to the Berachain Metadata repo)
   */
  async getIncentiveTokenPrices(
    incentiveTokens: Token[]
  ): Promise<TokenPrice[]> {
    // Implement to return incentive token prices
    return [];
  }
}
