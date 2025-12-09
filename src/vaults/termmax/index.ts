import { BaseAdapter, Token, TokenPrice } from "../../types";
import { fetchTokenPrice } from "../examples/hub-api";
import { parseEther } from "viem";

export class TermMaxVaultAdapter extends BaseAdapter {
    readonly name = "TermMaxVaultAdapter";
    readonly description = "TermMaxVaultAdapter is an adapter for TermMax's ERC4626 vaults";

    /**
     * Get staking tokens from reward vaults
     * These tokens are used to calculate TVL for APR calculations
     */
    async getRewardVaultStakingTokens(): Promise<Token[]> {
        return [
            {
                address: "0xd07F1862AE599697CDcd6Fd36dF3C33af25fd782",
                symbol: "ORGMC-HONEY",
                name: "HONEY Boost Yield Vault",
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
                // ERC4626: Convert 1 share to assets to get the ratio
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

                // Get the underlying asset address
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

                // Fetch the underlying asset price (HONEY)
                const assetPrice = (await fetchTokenPrice([underlyingAsset]))[0].price;

                // Calculate vault token price = ratio * underlying price
                const price = ratio * parseEther(assetPrice.toString());

                return {
                    address: token.address,
                    price: Number(price) / 1e18 / 1e18,
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
                address: "0x656b95E550C07a9ffe548bd4085c72418Ceb1dba",
                name: "Bera Governance Token",
                symbol: "BGT",
                decimals: 18,
                chainId: 80094,
            },
        ];
    }

    async getIncentiveTokenPrices(incentiveTokens: Token[]): Promise<TokenPrice[]> {
        const tokenPrices = await fetchTokenPrice(incentiveTokens.map((token) => token.address));
        return incentiveTokens.map((token) => {
            const tokenPrice = tokenPrices.find(
                (tp) => tp.address.toLowerCase() === token.address.toLowerCase()
            );
            return {
                address: token.address,
                price: tokenPrice?.price ?? 0,
                timestamp: tokenPrice?.updatedAt ?? Date.now(),
                chainId: 80094,
            };
        });
    }
}
