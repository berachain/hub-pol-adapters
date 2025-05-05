import { createPublicClient, http } from "viem";
import { berachain } from "viem/chains";
import { BaseAdapter, Token, TokenPrice } from "../../types";

export class CtBeraBaddiesHONEYVaultAdapter extends BaseAdapter {
    constructor() {
        super({
            name: "CtBeraBaddiesHONEYVaultAdapter",
            description:
                "Adapter for the Concrete x Berabaddies - HONEY vault. Users receive ctBeraBaddiesHONEY by depositing HONEY into Concrete’s Berabaddies Earn Vault. Vault: 0xe49Ff31B2B3Fd346b0d1832d9fE224ee0d1c1F9e.",
            enabled: true,
        });
    }

    async getRewardVaultStakingTokens(): Promise<Token[]> {
        return [
            {
                address: "0x310532d9d047c5972cd60852c1a4b675edc55fad",
                name: "Concrete Berabaddies HONEY Vault Token",
                symbol: "ctBeraBaddiesHONEY",
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
        const publicClient = createPublicClient({
            chain: berachain,
            transport: http("https://rpc.berachain.com"),
        });

        const prices = await Promise.all(
            stakingTokens.map(async (token) => {
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

    async getIncentiveTokens(): Promise<Token[]> {
        return [];
    }

    async getIncentiveTokenPrices(): Promise<TokenPrice[]> {
        return [];
    }
}
