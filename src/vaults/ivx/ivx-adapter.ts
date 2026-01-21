import { erc20Abi } from "viem";
import { BaseAdapter, Token, TokenPrice } from "../../types";

interface SupportedToken {
    readonly address: string;
    readonly decimals: number;
}

export class IVXVaultAdapter extends BaseAdapter {
    readonly name = "IVXVaultAdapter";
    readonly description = "IVXVaultAdapter is an adapter";

    /**
     * Get staking tokens from reward vaults
     * These tokens are used to calculate TVL for APR calculations
     */
    async getRewardVaultStakingTokens(): Promise<Token[]> {
        return [
            {
                address: "0x3b8B155E3C44f07f6EAd507570f4047C8B450A7F",
                symbol: "IVLP",
                name: "IVX Liquidity pool token",
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
        const IVXSupportedTokens: SupportedToken[] = [
            {
                address: "0xFCBD14DC51f0A4d49d5E53C2E0950e0bC26d0Dce",
                decimals: 18,
            },
            {
                address: "0x6969696969696969696969696969696969696969",
                decimals: 18,
            },
            {
                address: "0x2F6F07CDcf3588944Bf4C42aC74ff24bF56e7590",
                decimals: 18,
            },
            {
                address: "0x0555E30da8f98308EdB960aa94C0Db47230d2B9c",
                decimals: 8,
            },
        ];

        const IVXSupportedTokensAddresses: `0x${string}`[] = IVXSupportedTokens.map(
            (token) => token.address as `0x${string}`
        );
        const IVLPVault = "0x598eE20d8D372665a96AFba9d3B0Bfd817f1f340";

        const tokenPrices: number[] = await this._fetchTokensPrices(IVXSupportedTokensAddresses);
        const tokensBalance = await this._getTokensBalances(IVXSupportedTokensAddresses, IVLPVault);
        const prices: TokenPrice[] = [];
        for (const token of stakingTokens) {
            let TVL = 0;
            const IVLP = token.address as `0x${string}`;
            // Get Staked Token Total Supply
            const totalSupply = (await this.publicClient.readContract({
                address: IVLP,
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

            // Calculate TVL
            for (let i = 0; i < IVXSupportedTokens.length; i++) {
                const tokenBalance = tokensBalance[i];
                const tokenPrice = tokenPrices[i];
                const tokenValue =
                    (Number(tokenBalance) * tokenPrice) / 10 ** IVXSupportedTokens[i].decimals;
                TVL += tokenValue;
            }

            const totalSupplyInDecimal = Number(totalSupply) / 1e18;

            prices.push({
                address: token.address,
                price: TVL / totalSupplyInDecimal,
                timestamp: Date.now(),
                chainId: token.chainId,
            });
        }
        return prices;
    }

    private async _fetchTokensPrices(tokens: string[]): Promise<number[]> {
        const tokensPrices = await this.fetchTokenPrice(tokens);
        const priceMap = new Map(
            tokensPrices.map((priceObj) => [priceObj.address.toLowerCase(), Number(priceObj.price)])
        );

        // Return prices in the same order as the input tokens array
        return tokens.map((token) => {
            const price = priceMap.get(token.toLowerCase());
            if (price === undefined) {
                throw new Error(`Price not found for token: ${token}`);
            }
            return price;
        });
    }

    private async _getTokensBalances(
        tokens: `0x${string}`[],
        vaultAddress: `0x${string}`
    ): Promise<bigint[]> {
        // Get balances of tokens in the vault

        return this.publicClient.multicall({
            allowFailure: false,
            contracts: tokens.map(
                (token) =>
                    ({
                        address: token as `0x${string}`,
                        abi: erc20Abi,
                        functionName: "balanceOf",
                        args: [vaultAddress],
                    }) as const
            ),
        });
    }
    /**
     * Get incentive/reward tokens
     * These tokens are used to calculate reward value for APR calculations
     */
    async getIncentiveTokens(): Promise<Token[]> {
        return [
            {
                address: "0xFCBD14DC51f0A4d49d5E53C2E0950e0bC26d0Dce",
                symbol: "HONEY",
                name: "Honey",
                decimals: 18,
                chainId: 80094,
            },
            {
                address: "0x6969696969696969696969696969696969696969",
                symbol: "WBERA",
                name: "Wrapped Bera",
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
