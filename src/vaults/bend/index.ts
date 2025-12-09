import { BaseAdapter, Token, TokenPrice } from "../../types";
import { fetchTokenPrice } from "../examples/hub-api";
import { parseEther } from "viem";

export class BendVaultAdapter extends BaseAdapter {
    readonly name = "BendVaultAdapter";
    readonly description = "BendVaultAdapter is an adapter for Bend's vaults";

    /**
     * Get staking tokens from reward vaults
     * These tokens are used to calculate TVL for APR calculations
     */
    async getRewardVaultStakingTokens(): Promise<Token[]> {
        // Implement to return staking tokens
        // Example:
        return [
            {
                address: "0x30BbA9CD9Eb8c95824aa42Faa1Bb397b07545bc1",
                symbol: "Re7HONEY",
                name: "Re7 HONEY",
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
                // Perform individual calls to get the underlying asset, totalSupply and totalAssets
                const ratio = await this.publicClient.readContract({
                    address: token.address as `0x${string}`,
                    args: [parseEther("1")],
                    abi: [
                        {
                            inputs: [{ internalType: "uint256", name: "shares", type: "uint256" }],
                            name: "convertToAssets",
                            outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
                            stateMutability: "view",
                            type: "function",
                        },
                    ],
                    functionName: "convertToAssets",
                });

                const underlyingAsset = await this.publicClient.readContract({
                    address: token.address as `0x${string}`,
                    abi: [
                        {
                            type: "function",
                            name: "asset",
                            inputs: [],
                            outputs: [{ name: "", type: "address" }],
                            stateMutability: "view",
                        },
                    ],
                    functionName: "asset",
                });

                const assetPrice = (await fetchTokenPrice([underlyingAsset]))[0].price;

                const price = ratio * parseEther(assetPrice.toString());

                return {
                    address: token.address,
                    price: Number(price) / 1e18 / 1e18, // Convert from bigint to number and adjust decimals
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
                address: "0xFCBD14DC51f0A4d49d5E53C2E0950e0bC26d0Dce",
                name: "Honey",
                symbol: "HONEY",
                decimals: 18,
                chainId: 80094,
            },
            {
                address: "0x6969696969696969696969696969696969696969",
                name: "Wrapped Bera",
                symbol: "WBERA",
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
