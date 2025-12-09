import { BaseAdapter, Token, TokenPrice } from "../../types";
import { fetchTokenPrice } from "../examples/hub-api";

export class WberaUsdcVaultAdapter extends BaseAdapter {
    constructor() {
        super({
            name: "WberaUsdcVaultAdapter",
            description:
                "WberaUsdcVaultAdapter is an adapter for the Wbera | USDC.e Vault at https://hub.berachain.com/earn/0x519cef5cc2913bcefdd03d0a22601c19794c4581/",
            enabled: true,
        });
    }

    async getRewardVaultStakingTokens(): Promise<Token[]> {
        return [
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
                const totalSupply = (await this.publicClient.readContract({
                    address: token.address as `0x${string}`,
                    abi: [
                        {
                            type: "function",
                            name: "totalSupply",
                            inputs: [],
                            outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
                            stateMutability: "view",
                        },
                    ],
                    functionName: "totalSupply",
                })) as bigint;

                const token0_addr = (await this.publicClient.readContract({
                    address: token.address as `0x${string}`,
                    abi: [
                        {
                            type: "function",
                            name: "token0",
                            inputs: [],
                            outputs: [{ internalType: "address", name: "", type: "address" }],
                            stateMutability: "view",
                        },
                    ],
                    functionName: "token0",
                })) as string;

                const token1_addr = (await this.publicClient.readContract({
                    address: token.address as `0x${string}`,
                    abi: [
                        {
                            type: "function",
                            name: "token1",
                            inputs: [],
                            outputs: [{ internalType: "address", name: "", type: "address" }],
                            stateMutability: "view",
                        },
                    ],
                    functionName: "token1",
                })) as string;

                const token0_price = (await fetchTokenPrice([token0_addr]))[0].price;
                const token1_price = (await fetchTokenPrice([token1_addr]))[0].price;

                const token0_amount = await this._getTokensBalances(
                    [token0_addr as `0x${string}`],
                    token.address as `0x${string}`
                );
                const token1_amount = await this._getTokensBalances(
                    [token1_addr as `0x${string}`],
                    token.address as `0x${string}`
                );

                if (totalSupply === 0n)
                    throw new Error(`Failed to fetch data for ${token.address}: totalSupply is 0`);

                const price =
                    ((Number(token0_amount[0]) / 10 ** 6) * token0_price +
                        (Number(token1_amount[0]) / 10 ** 18) * token1_price) /
                    (Number(totalSupply) / 10 ** 18);

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

    private async _getTokensBalances(
        tokens: `0x${string}`[],
        vaultAddress: `0x${string}`
    ): Promise<bigint[]> {
        // Get balances of tokens in the vault

        const balances: bigint[] = [];
        for (const token of tokens) {
            const balance = (await this.publicClient.readContract({
                address: token as `0x${string}`,
                abi: [
                    {
                        type: "function",
                        name: "balanceOf",
                        inputs: [{ name: "account", type: "address", internalType: "address" }],
                        outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
                        stateMutability: "view",
                    },
                ],
                functionName: "balanceOf",
                args: [vaultAddress],
            })) as bigint;
            balances.push(balance);
        }
        return balances;
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
