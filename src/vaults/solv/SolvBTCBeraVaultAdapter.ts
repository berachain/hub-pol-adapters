import { BaseAdapter, Token, TokenPrice } from "../../types";
import { fetchTokenPrice } from "../examples/hub-api";

export class SolvBTCBeraVaultAdapter extends BaseAdapter {
    readonly name = "SolvBTCBeraVaultAdapter";
    readonly description =
        "SolvBTCBeraVaultAdapter is an adapter for Solv's SolvBTC.BERA vaults at https://hub.berachain.com/vaults/0x9a5620309c20b8beca1d59c6def1e73ac6cba45d/";

    /**
     * Get staking tokens from reward vaults
     * These tokens are used to calculate TVL for APR calculations
     */
    async getRewardVaultStakingTokens(): Promise<Token[]> {
        // Implement to return staking tokens
        // Example:
        return [
            {
                address: "0x0F6f337B09cb5131cF0ce9df3Beb295b8e728F3B",
                symbol: "SolvBTC.BERA",
                name: "SolvBTC Bera Vault",
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
                // 1 SolvBTC.BERA = 1 SolvBTC
                const price = (
                    await fetchTokenPrice(["0x541FD749419CA806a8bc7da8ac23D346f2dF8B77"])
                )[0].price;

                return {
                    address: token.address,
                    price: price,
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
                address: "0x541FD749419CA806a8bc7da8ac23D346f2dF8B77",
                name: "Solv BTC",
                symbol: "SolvBTC",
                decimals: 18,
                chainId: 80094,
            },
            {
                address: "0xFCBD14DC51f0A4d49d5E53C2E0950e0bC26d0Dce",
                name: "Honey",
                symbol: "HONEY",
                decimals: 18,
                chainId: 80094,
            },
            {
                address: "0xac03CABA51e17c86c921E1f6CBFBdC91F8BB2E6b",
                name: "Infrared BGT",
                symbol: "iBGT",
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
