import { BaseAdapter, Token, TokenPrice } from "../../types";

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
                    await this.fetchTokenPrice(["0x541FD749419CA806a8bc7da8ac23D346f2dF8B77"])
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
}
