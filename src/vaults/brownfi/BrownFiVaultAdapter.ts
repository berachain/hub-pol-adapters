import { erc20Abi, formatUnits } from "viem";
import { BaseAdapter, Token, TokenPrice } from "../../types";
import { fetchTokenPrice } from "../examples/hub-api";

export class BrownFiVaultAdapter extends BaseAdapter {
    readonly name = "BrownFiVaultAdapter";
    readonly description =
        "BrownFiVaultAdapter is an adapter for the BrownFi Vaults at https://hub.berachain.com/earn/";

    async getRewardVaultStakingTokens(): Promise<Token[]> {
        return [
            {
                address: "0xd932c344e21ef6C3a94971bf4D4cC71304E2a66C",
                name: "BrownFi V2",
                symbol: "BF-V2",
                decimals: 18,
                chainId: 80094,
            },
            {
                address: "0xd57Da672354905B9E42Df077Df77E554dC5Fd1Cc",
                name: "BrownFi V2",
                symbol: "BF-V2",
                decimals: 18,
                chainId: 80094,
            },
        ];
    }

    async getRewardVaultStakingTokenPrices(stakingTokens: Token[]): Promise<TokenPrice[]> {
        const prices = await Promise.all(
            stakingTokens.map(async (token) => {
                const [totalSupply, token0_addr, token1_addr] = await this.publicClient.multicall({
                    allowFailure: false,
                    contracts: [
                        {
                            address: token.address as `0x${string}`,
                            abi: [
                                {
                                    type: "function",
                                    name: "totalSupply",
                                    inputs: [],
                                    outputs: [
                                        { internalType: "uint256", name: "", type: "uint256" },
                                    ],
                                    stateMutability: "view",
                                },
                            ],
                            functionName: "totalSupply",
                            args: [],
                        },
                        {
                            address: token.address as `0x${string}`,
                            abi: [
                                {
                                    type: "function",
                                    name: "token0",
                                    inputs: [],
                                    outputs: [
                                        { internalType: "address", name: "", type: "address" },
                                    ],
                                    stateMutability: "view",
                                },
                            ],
                            functionName: "token0",
                            args: [],
                        },
                        {
                            address: token.address as `0x${string}`,
                            abi: [
                                {
                                    type: "function",
                                    name: "token1",
                                    inputs: [],
                                    outputs: [
                                        { internalType: "address", name: "", type: "address" },
                                    ],
                                    stateMutability: "view",
                                },
                            ],
                            functionName: "token1",
                            args: [],
                        },
                    ],
                });

                const tokenPrices = await fetchTokenPrice([token0_addr, token1_addr]);

                const token0_price = tokenPrices.find(
                    (x) => x.address.toLowerCase() === token0_addr.toLowerCase()
                )?.price;
                const token1_price = tokenPrices.find(
                    (x) => x.address.toLowerCase() === token1_addr.toLowerCase()
                )?.price;

                if (token0_price === undefined || token1_price === undefined) {
                    throw new Error(
                        `Failed to fetch token prices for ${token0_addr} or ${token1_addr}`
                    );
                }

                const [token0_amount, token1_amount, token0_decimals, token1_decimals] =
                    await this.publicClient.multicall({
                        allowFailure: false,
                        contracts: [
                            {
                                address: token0_addr,
                                abi: erc20Abi,
                                functionName: "balanceOf",
                                args: [token.address],
                            },
                            {
                                address: token1_addr,
                                abi: erc20Abi,
                                functionName: "balanceOf",
                                args: [token.address],
                            },
                            {
                                address: token0_addr,
                                abi: erc20Abi,
                                functionName: "decimals",
                                args: [],
                            },
                            {
                                address: token1_addr,
                                abi: erc20Abi,
                                functionName: "decimals",
                                args: [],
                            },
                        ],
                    });

                if (totalSupply === 0n)
                    throw new Error(`Failed to fetch data for ${token.address}: totalSupply is 0`);

                const price =
                    Number(formatUnits(token0_amount, token0_decimals)) * token0_price +
                    (Number(formatUnits(token1_amount, token1_decimals)) * token1_price) /
                        Number(formatUnits(totalSupply, 18));

                return {
                    address: token.address,
                    price,
                    timestamp: Date.now(),
                    chainId: 80094,
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
            {
                address: "0x6969696969696969696969696969696969696969",
                symbol: "WBERA",
                name: "Wrapped BERA",
                decimals: 18,
                chainId: 80094,
            },
        ];
    }

    async getIncentiveTokenPrices(_incentiveTokens: Token[]): Promise<TokenPrice[]> {
        return [];
    }
}
