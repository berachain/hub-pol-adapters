import { BaseAdapter, Token, TokenPrice } from "../../types";
import { createPublicClient, http } from "viem";
import { berachain } from "viem/chains";

export class CtBeraFBTCVaultAdapter extends BaseAdapter {
    constructor() {
        super({
            name: "CtBeraFBTCVaultAdapter",
            description:
                "Adapter for the Concrete - FBTC vault. Users receive ctBeraFBTC by depositing FTBC into Concrete’s Berachain Bitcoin vault. Vault: 0x127BF6361ff7495F2A69d83d9Ad2092D3dfEE7Ab.",
            enabled: true,
        });
    }

    async getRewardVaultStakingTokens(): Promise<Token[]> {
        return [
            {
                address: "0x040f89fcbae6ce2b3fbe47fc84b1248c91d716c2",
                name: "Concrete Berachain FBTC Vault Token",
                symbol: "ctBeraFBTC",
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
                address: "0xbAC93A69c62a1518136FF840B788Ba715cbDfE2B",
                name: "Fire Bitcoin (FBTC)",
                symbol: "FBTC",
                decimals: 18,
                chainId: 80094,
            },
        ];
    }

    async getIncentiveTokenPrices(): Promise<TokenPrice[]> {
        return [];
    }
}
