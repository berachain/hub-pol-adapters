import { BaseAdapter, Token, TokenPrice } from "../../types";

export class SxVaultAdapter extends BaseAdapter {
    readonly name = "SxVaultAdapter";
    readonly description =
        "SxVaultAdapter is an adapter for SX Bet's SXBRT vault at https://hub.berachain.com/vaults/0xd1dca482d1af3c2e23749a965db3a74c4e29b928/";

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
        const beraPrice = (
            await this.fetchTokenPrice(["0x6969696969696969696969696969696969696969"])
        )[0].price;
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
}
