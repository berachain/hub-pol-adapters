import { BaseAdapter, Token, TokenPrice } from "../../types";
import { uniswapV3PoolAbi } from "../../utils/uniswapV3PoolAbi";

export class AquaBeraAdapter extends BaseAdapter {
    readonly name = "AquaBeraAdapter";
    readonly description =
        "Aquabera makes managing, growing, and launching crypto on Berachain simple, safe, and rewarding.";

    /**
     * Get staking tokens from reward vaults
     * These tokens are used to calculate TVL for APR calculations
     */
    async getRewardVaultStakingTokens(): Promise<Token[]> {
        // Implement to return staking tokens
        return [
            {
                address: "0xf9845a03F7e6b06645A03a28b943C8A4B5fE7BCC",
                symbol: "AB-KODIAK-WBERA-BERAMO",
                name: "AquaBera Kodiak wBera Beramo LP Token",
                decimals: 18,
                chainId: 80094,
            },
            {
                address: "0x04fD6a7B02E2e48caedaD7135420604de5f834f8",
                symbol: "AB-KODIAK-WBERA-HENLO",
                name: "AquaBera Kodiak wBera Henlo LP Token",
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
        const onChainData = await Promise.all(
            stakingTokens.map(async (token) => {
                return await this.publicClient.multicall({
                    allowFailure: false,
                    contracts: [
                        {
                            address: token.address as `0x${string}`,
                            abi: uniswapV3PoolAbi,
                            functionName: "totalSupply",
                            args: [],
                        },
                        {
                            address: token.address as `0x${string}`,
                            abi: [
                                {
                                    type: "function",
                                    name: "getTotalAmounts",
                                    inputs: [],
                                    outputs: [
                                        {
                                            internalType: "uint256",
                                            name: "total0",
                                            type: "uint256",
                                        },
                                        {
                                            internalType: "uint256",
                                            name: "total1",
                                            type: "uint256",
                                        },
                                    ],
                                    stateMutability: "view",
                                },
                            ],
                            functionName: "getTotalAmounts",
                            args: [],
                        },
                        {
                            address: token.address as `0x${string}`,
                            abi: uniswapV3PoolAbi,
                            functionName: "token0",
                            args: [],
                        },
                        {
                            address: token.address as `0x${string}`,
                            abi: uniswapV3PoolAbi,
                            functionName: "token1",
                            args: [],
                        },
                    ],
                });
            })
        );
        const prices = await this.fetchTokenPrice(
            onChainData
                .map(([_, __, token0_addr, token1_addr]) => [token0_addr, token1_addr])
                .flat()
                // unique tokens
                .filter((token, idx, self) => self.indexOf(token) === idx)
        );

        return onChainData.map(
            ([totalSupply, [totalAmount0, totalAmount1], token0_addr, token1_addr], idx) => {
                const token = stakingTokens[idx];
                if (totalSupply === 0n)
                    throw new Error(
                        `Failed to fetch LSP data for ${token.address}: totalSupply is 0`
                    );

                const token0_price = prices.find(
                    (x) => x.address.toLowerCase() === token0_addr.toLowerCase()
                )?.price;
                const token1_price = prices.find(
                    (x) => x.address.toLowerCase() === token1_addr.toLowerCase()
                )?.price;

                if (token0_price === undefined) {
                    throw new Error(
                        `Failed to find token price for underlying token: ${token0_addr}`
                    );
                }

                if (token1_price === undefined) {
                    throw new Error(
                        `Failed to find token price for underlying token: ${token1_addr}`
                    );
                }

                //Multiply up to get integer price
                const token0IntPrice = token0_price * 1e18;
                const token1IntPrice = token1_price * 1e18;

                // LP price = (totalAmount0 * price0 + totalAmount1 * price1) / totalSupply
                const price =
                    (Number(totalAmount0) * token0IntPrice +
                        Number(totalAmount1) * token1IntPrice) /
                    Number(totalSupply) /
                    1e18;

                return {
                    address: token.address,
                    price,
                    timestamp: Date.now(),
                    chainId: 80094,
                };
            }
        );
    }

    /**
     * Get incentive/reward tokens
     * These tokens are used to calculate reward value for APR calculations
     */
    async getIncentiveTokens(): Promise<Token[]> {
        // Implement to return incentive tokens
        return [
            {
                address: "0xb2F776e9c1C926C4b2e54182Fac058dA9Af0B6A5",
                symbol: "HENLO",
                name: "Henlo Token",
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
    async getIncentiveTokenPrices(): Promise<TokenPrice[]> {
        // Implement to return incentive token prices
        return [];
    }
}
