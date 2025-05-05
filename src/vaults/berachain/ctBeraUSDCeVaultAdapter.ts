import { BaseAdapter, Token, TokenPrice } from "../../types";
import { createPublicClient, http } from "viem";
import { berachain } from "viem/chains";

export class CtBeraUSDCeVaultAdapter extends BaseAdapter {
    constructor() {
        super({
            name: "CtBeraUSDCeVaultAdapter",
            description:
                "Adapter for the Concrete - USDC.e vault. Users receive ctBeraUSDC.e by depositing USDC.e into Concrete’s Berachain Stables vault. Vault: 0xc3cac88fd629652BBe0C3454D5d3049368A73849.",
            enabled: true,
        });
    }

    async getRewardVaultStakingTokens(): Promise<Token[]> {
        return [
            {
                address: "0xd5e8006cb675d6556915e92c6253e5a9b9df5431",
                name: "Concrete Berachain USDC.e Vault Token",
                symbol: "ctBeraUSDC.e",
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
                    address: "0xc3cac88fd629652BBe0C3454D5d3049368A73849",
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
                    address: "0xc3cac88fd629652BBe0C3454D5d3049368A73849",
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
                        `Failed to fetch LSP data for ${token.address} on 0xc3cac88fd629652BBe0C3454D5d3049368A73849: totalSupply is null`
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
                address: "0x549943e04f40284185054145c6E4e9568C1D3241",
                name: "Bridged USDC (Stargate) (USDC.e)",
                symbol: "USDC.e",
                decimals: 18,
                chainId: 80094,
            },
        ];
    }

    async getIncentiveTokenPrices(): Promise<TokenPrice[]> {
        return [];
    }
}
