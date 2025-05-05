import { BaseAdapter, Token, TokenPrice } from "../../types";
import { createPublicClient, http } from "viem";
import { berachain } from "viem/chains";

export class CtBeraWBTCVaultAdapter extends BaseAdapter {
    constructor() {
        super({
            name: "CtBeraWBTCVaultAdapter",
            description:
                "Adapter for the Concrete - WBTC vault. Users receive ctBeraWBTC by depositing WBTC into Concrete’s Berachain Bitcoin vault. Vault: 0x335e7b56054F830883D1509AFDce58DedceFb29C.",
            enabled: true,
        });
    }

    async getRewardVaultStakingTokens(): Promise<Token[]> {
        return [
            {
                address: "0x4132997563d7621644a13a2dfeb925df527455d6",
                name: "Concrete Berachain WBTC Vault Token",
                symbol: "ctBeraWBTC",
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
                    address: "0x335e7b56054F830883D1509AFDce58DedceFb29C",
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
                    address: "0x335e7b56054F830883D1509AFDce58DedceFb29C",
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

                // if (totalSupply === 0n)
                // @TODO: Rever this change after the vaults are funded, this is allowed for now given timing restrictions
                if (totalSupply == null)
                    throw new Error(
                        `Failed to fetch LSP data for ${token.address} on 0x335e7b56054F830883D1509AFDce58DedceFb29C: totalSupply is null`
                    );

                const price = (totalAssets * BigInt(1e18)) / (totalSupply || 1n);

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
                address: "0x0555E30da8f98308EdB960aa94C0Db47230d2B9c",
                name: "Wrapped BTC (WBTC)",
                symbol: "WBTC",
                decimals: 18,
                chainId: 80094,
            },
        ];
    }

    async getIncentiveTokenPrices(): Promise<TokenPrice[]> {
        return [];
    }
}
