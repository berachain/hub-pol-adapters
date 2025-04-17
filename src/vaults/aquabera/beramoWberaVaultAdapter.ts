import { BaseAdapter, Token, TokenPrice } from "../../types";
import { berachain } from "viem/chains";
import { createPublicClient, http } from "viem";

const BERACHAIN_API_URL = "https://api.berachain.com/graphql";

type TokenPriceData = {
    address: string;
    chain: string;
    price: number;
    updatedAt: BigInteger;
    updatedBy: string;
};

const PRICE_QUERY = `
  query GetTokenPrices($addresses: [String!]!) {
    tokenGetCurrentPrices(addressIn: $addresses, chains: BERACHAIN) {
      address
      chain
      price
      updatedAt
      updatedBy
    }
  }
`;

export class AquaBeraBeramoAdapter extends BaseAdapter {
    constructor() {
        super({
            name: "AquaBera",
            description:
                "Aquabera makes managing, growing, and launching crypto on Berachain simple, safe, and rewarding.",
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
                address: "0xf9845a03F7e6b06645A03a28b943C8A4B5fE7BCC",
                symbol: "AB-KODIAK-WBERA-BERAMO",
                name: "AquaBera Kodiak wBera Beramo LP Token",
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

                const [totalAmount0, totalAmount1] = (await publicClient.readContract({
                    address: token.address as `0x${string}`,
                    abi: [
                        {
                            type: "function",
                            name: "getTotalAmounts",
                            inputs: [],
                            outputs: [
                                { internalType: "uint256", name: "total0", type: "uint256" },
                                { internalType: "uint256", name: "total1", type: "uint256" },
                            ],
                            stateMutability: "view",
                        },
                    ],
                    functionName: "getTotalAmounts",
                })) as [bigint, bigint];

                const token0_addr = (await publicClient.readContract({
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

                const token1_addr = (await publicClient.readContract({
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

                if (totalSupply === 0n)
                    throw new Error(
                        `Failed to fetch LSP data for ${token.address}: totalSupply is 0`
                    );

                const prices = await getTokenPrices([token0_addr, token1_addr]);

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
                address: "0x1F7210257FA157227D09449229a9266b0D581337",
                symbol: "BERAMO",
                name: "Beramonium Coin",
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

async function getTokenPrices(addresses: string[]): Promise<TokenPriceData[]> {
    try {
        const response = await fetch(BERACHAIN_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                query: PRICE_QUERY,
                variables: {
                    addresses,
                },
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.data.tokenGetCurrentPrices;
    } catch (error) {
        console.error("Error fetching pool data:", error);
        throw error;
    }
}
