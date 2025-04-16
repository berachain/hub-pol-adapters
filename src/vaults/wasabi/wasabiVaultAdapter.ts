import { BaseAdapter, Token, TokenPrice } from "../../types";
import { fetchTokenPrice } from "../examples/hub-api";
import { berachain } from "viem/chains";
import { createPublicClient, http, parseEther } from "viem";

export class SWBERAVaultAdapter extends BaseAdapter {
    constructor() {
        super({
            name: "sWBERAVaultAdapter",
            description:
                "sWBERAVaultAdapter is an adapter for the sWBERA Vault at https://hub.berachain.com/vaults/0x4ea84882228a5c881675151e951235e45256a484/",
            enabled: true,
        });
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
                address: "0xc95ab9eff8fb48760703c74416764b8f898afa1b",
                symbol: "sWBERA",
                name: "Spicy WBERA Vault (sWBERA)",
                decimals: 18,
                chainId: 80094,
            },
            {
                address: "0xd948212f077e552533158becbc1882c1b19c40fe",
                symbol: "sHONEY",
                name: "Spicy HONEY Vault (sHONEY)",
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
        // Create a public client directly in the function
        const publicClient = createPublicClient({
            chain: berachain,
            transport: http("https://rpc.berachain.com"),
        });

        const prices = await Promise.all(
            stakingTokens.map(async (token) => {
                // Perform individual calls to get the underlying asset, totalSupply and totalAssets
                const totalSupply = (await publicClient.readContract({
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

                const totalAssets = (await publicClient.readContract({
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

                const underlyingAsset = (await publicClient.readContract({
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
                })) as `0x${string}`;

                if (totalSupply === 0n)
                    throw new Error(
                        `Failed to fetch LSP data for ${token.address}: totalSupply is 0`
                    );

                const assetPrice = (await fetchTokenPrice([underlyingAsset]))[0].price;

                const price = (totalAssets * parseEther(assetPrice.toString())) / totalSupply;

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
