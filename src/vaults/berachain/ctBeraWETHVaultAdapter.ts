import { BaseAdapter, Token, TokenPrice } from "../../types";
import { createPublicClient, http } from "viem";
import { berachain } from "viem/chains";

export class CtBeraWETHVaultAdapter extends BaseAdapter {
    constructor() {
        super({
            name: "CtBeraWETHVaultAdapter",
            description:
                "Adapter for the Concrete - WETH vault. Users receive ctBeraWETH by depositing WETH into Concrete’s Berachain Ethereum vault. Vault: 0x8d3e53f5521927E5c78D42B4f9e08ae8DF91B772.",
            enabled: true,
        });
    }

    async getRewardVaultStakingTokens(): Promise<Token[]> {
        return [
            {
                address: "0x238cb854d644cb9b7a08e65eb803bffc05cfb834",
                name: "Concrete Berachain WETH Vault Token",
                symbol: "ctBeraWETH",
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
        return [
            {
                address: "0x2f6f07cdcf3588944bf4c42ac74ff24bf56e7590",
                name: "WETH (WETH)",
                symbol: "WETH",
                decimals: 18,
                chainId: 80094,
            },
        ];
    }

    async getIncentiveTokenPrices(): Promise<TokenPrice[]> {
        return [];
    }
}
