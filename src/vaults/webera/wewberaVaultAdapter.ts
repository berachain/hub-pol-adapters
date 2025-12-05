import { BaseAdapter, Token, TokenPrice } from "../../types";

export class WewberaVaultAdapter extends BaseAdapter {
    constructor() {
        super({
            name: "WewberaVaultAdapter",
            description:
                "WewberaVaultAdapter is an adapter for the webera-vault-wbera at https://hub.berachain.com/vaults/0x5e747644dd7a3e58485db8e836ca7654242dae2a/",
            enabled: true,
        });
    }

    /**
     * Get staking tokens from reward vaults
     * These tokens are used to calculate TVL for APR calculations
     */
    async getRewardVaultStakingTokens(): Promise<Token[]> {
        return [
            {
                address: "0x55a050f76541c2554e9dfa3a0b4e665914bf92ea",
                symbol: "weWBERA",
                name: "webera-vault-wbera",
                decimals: 18,
                chainId: 80094,
            },
        ];
    }

    /**
     * Get prices for staking tokens
     * These prices are used to calculate TVL for APR calculations
     */
    async getRewardVaultStakingTokenPrices(stakingTokens: Token[]): Promise<TokenPrice[]> {
        const prices = await Promise.all(
            stakingTokens.map(async (token) => {
                const totalSupply = (await this.publicClient.readContract({
                    address: token.address as `0x${string}`,
                    abi: [
                        {
                            type: "function",
                            name: "totalSupply",
                            inputs: [],
                            outputs: [{ name: "", type: "uint256" }],
                            stateMutability: "view",
                        },
                    ],
                    functionName: "totalSupply",
                })) as bigint;

                const totalAssets = (await this.publicClient.readContract({
                    address: token.address as `0x${string}`,
                    abi: [
                        {
                            type: "function",
                            name: "totalAssets",
                            inputs: [],
                            outputs: [{ name: "", type: "uint256" }],
                            stateMutability: "view",
                        },
                    ],
                    functionName: "totalAssets",
                })) as bigint;

                if (totalSupply === 0n)
                    throw new Error(
                        `Failed to fetch LSP data for ${token.address}: totalSupply is 0`
                    );

                const price = (totalAssets * BigInt(1e18)) / totalSupply;

                return {
                    address: token.address,
                    price: Number(price) / 1e18, // Convert from bigint to number and adjust decimals
                    timestamp: Date.now(),
                    chainId: token.chainId,
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
                address: "0x6969696969696969696969696969696969696969",
                name: "Wrapped Bera",
                symbol: "WBERA",
                decimals: 18,
                chainId: 80094,
            },
            {
                address: "0x55a050f76541c2554e9dfa3a0b4e665914bf92ea",
                name: "webera-vault-wbera",
                symbol: "weWBERA",
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
    async getIncentiveTokenPrices(_incentiveTokens: Token[]): Promise<TokenPrice[]> {
        // Implement to return incentive token prices
        return [];
    }
}
