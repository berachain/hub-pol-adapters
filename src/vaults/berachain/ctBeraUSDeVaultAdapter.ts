import { BaseAdapter, Token, TokenPrice } from "../../types";
import { createPublicClient, http } from "viem";
import { berachain } from "viem/chains";

export class CtBeraUSDeVaultAdapter extends BaseAdapter {
    constructor() {
        super({
            name: "CtBeraUSDeVaultAdapter",
            description:
                "Adapter for the Concrete - USDe vault. Users receive ctBeraUSDe by depositing USDe into Concrete’s Berachain Stables vault. Vault: 0x585934AfBf1FA9f563b80283F8B916Dd8F66a9b6.",
            enabled: true,
        });
    }

    async getRewardVaultStakingTokens(): Promise<Token[]> {
        return [
            {
                address: "0x9a4CCbbA792ea0f64D62f15416517fcd9ce30283",
                name: "Concrete Berachain USDe Vault Token",
                symbol: "ctBeraUSDe",
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
                    address: "0x585934AfBf1FA9f563b80283F8B916Dd8F66a9b6",
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
                    address: "0x585934AfBf1FA9f563b80283F8B916Dd8F66a9b6",
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
                        `Failed to fetch LSP data for ${token.address} on 0x585934AfBf1FA9f563b80283F8B916Dd8F66a9b6: totalSupply is null`
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
                address: "0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34",
                name: "USDe (USDe)",
                symbol: "USDe",
                decimals: 18,
                chainId: 80094,
            },
        ];
    }

    async getIncentiveTokenPrices(): Promise<TokenPrice[]> {
        return [];
    }
}
