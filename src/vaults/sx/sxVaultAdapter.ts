import { BaseAdapter, Token, TokenPrice } from "../../types";
import { fetchTokenPrice } from "../examples/hub-api";

export class SxVaultAdapter extends BaseAdapter {
    constructor() {
        super({
            name: "SxVaultAdapter",
            description:
                "SxVaultAdapter is an adapter for SX Bet's SXBRT vault at https://hub.berachain.com/vaults/0xd1dca482d1af3c2e23749a965db3a74c4e29b928/",
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
                address: "0xe87e5456cc78578d1fcd95048fa639e5e32ee63a",
                symbol: "SXBRT",
                name: "SX Bera Token (SXBRT)",
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
        const beraPrice = (await fetchTokenPrice(["0x6969696969696969696969696969696969696969"]))[0]
            .price;
        const prices = await Promise.all(
            stakingTokens.map(async (token) => {
                return {
                    address: token.address,
                    price: beraPrice, // 1 SXBRT = 1 BGT
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
