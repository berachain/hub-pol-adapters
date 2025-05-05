import { BaseAdapter, Token, TokenPrice } from "../../types";
import { createPublicClient, http } from "viem";
import { berachain } from "viem/chains";

export class CtBeraBaddiesWBERAVaultAdapter extends BaseAdapter {
    constructor() {
        super({
            name: "CtBeraBaddiesWBERAVaultAdapter",
            description:
                "Adapter for the Concrete x Berabaddies - BERA vault. Users receive ctBeraBaddiesWBERA by depositing BERA or WBERA into Concrete’s Berabaddies Earn Vault. Vault: 0xA15E1De8a220Ca9C63DB4E8a1E9043fb953B3713.",
            enabled: true,
        });
    }

    async getRewardVaultStakingTokens(): Promise<Token[]> {
        return [
            {
                address: "0x6e0a95f6ac86ead002d58c83fc1b5a712ee9be7c",
                name: "Concrete Berabaddies BERA Vault Token",
                symbol: "ctBeraBaddiesWBERA",
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
                    address: "0xA15E1De8a220Ca9C63DB4E8a1E9043fb953B3713",
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
                    address: "0xA15E1De8a220Ca9C63DB4E8a1E9043fb953B3713",
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
                        `Failed to fetch LSP data for ${token.address} on 0xA15E1De8a220Ca9C63DB4E8a1E9043fb953B3713: totalSupply is 0`
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
        return [
            {
                address: "0x6969696969696969696969696969696969696969",
                name: "Wrapped Bera (WBERA)",
                symbol: "WBERA",
                decimals: 18,
                chainId: 80094,
            },
        ];
    }

    async getIncentiveTokenPrices(): Promise<TokenPrice[]> {
        return [];
    }
}
