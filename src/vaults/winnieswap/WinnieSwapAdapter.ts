import { BaseAdapter, Token, TokenPrice } from "../../types";
import { uniswapV3PoolAbi } from "../../utils/uniswapV3PoolAbi";

// GraphQL endpoint for WinnieSwap Indexer (Ponder)
const WINNIESWAP_GRAPHQL_URL = "https://sub.winnieswap.com/";

// Berachain API for token prices
const BERACHAIN_API_URL = "https://api.berachain.com/graphql";

interface StickyVaultData {
    id: string; // Vault address
    name: string;
    pool: string; // Pool address (string)
    poolRef: {
        token0Ref: {
            symbol: string;
        };
        token1Ref: {
            symbol: string;
        };
        feeTier: number;
    };
}

interface TokenPriceData {
    address: string;
    chain: string;
    price: number;
    updatedAt: BigInteger;
    updatedBy: string;
}

const VAULTS_QUERY = `
  query GetStickyVaults {
    stickyVaults {
      items {
        id
        name
        pool
        poolRef {
          token0Ref {
            symbol
          }
          token1Ref {
            symbol
          }
          feeTier
        }
      }
    }
  }
`;

const TOKEN_PRICE_QUERY = `
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

export class WinnieSwapAdapter extends BaseAdapter {
    readonly name = "WinnieSwapAdapter";
    readonly description = "WinnieSwapAdapter is an adapter for WinnieSwap's Sticky Vaults";

    /**
     * Get staking tokens from WinnieSwap Sticky Vaults
     * These are the vault LP tokens that users stake
     */
    async getRewardVaultStakingTokens(): Promise<Token[]> {
        try {
            const response = await fetch(WINNIESWAP_GRAPHQL_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    query: VAULTS_QUERY,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const vaults: StickyVaultData[] = data.data?.stickyVaults?.items || [];

            // Convert vault data to Token format
            return vaults.map((vault) => ({
                address: vault.id.toLowerCase() as `0x${string}`,
                symbol: `${vault.poolRef.token0Ref.symbol}-${vault.poolRef.token1Ref.symbol}-${vault.poolRef.feeTier}`,
                name: vault.name,
                decimals: 18,
                chainId: 80094,
            }));
        } catch (error) {
            console.error("Error fetching WinnieSwap vaults:", error);
            throw error;
        }
    }

    /**
     * Get prices for Sticky Vault LP tokens
     * Price = (totalAmount0 * price0 + totalAmount1 * price1) / totalSupply
     */
    async getRewardVaultStakingTokenPrices(stakingTokens: Token[]): Promise<TokenPrice[]> {
        const prices = await Promise.all(
            stakingTokens.map(async (token) => {
                try {
                    // Get total supply of the vault token

                    const [totalSupply, token0_addr, token1_addr, [totalAmount0, totalAmount1]] =
                        await this.publicClient.multicall({
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
                                {
                                    address: token.address as `0x${string}`,
                                    abi: [
                                        {
                                            type: "function",
                                            name: "getUnderlyingBalances",
                                            inputs: [],
                                            outputs: [
                                                {
                                                    internalType: "uint256",
                                                    name: "amount0Current",
                                                    type: "uint256",
                                                },
                                                {
                                                    internalType: "uint256",
                                                    name: "amount1Current",
                                                    type: "uint256",
                                                },
                                            ],
                                            stateMutability: "view",
                                        },
                                    ],
                                    functionName: "getUnderlyingBalances",
                                    args: [],
                                },
                            ],
                        });

                    if (totalSupply === 0n) {
                        console.warn(
                            `Vault ${token.address} has zero totalSupply, skipping price calculation`
                        );
                        return {
                            address: token.address,
                            price: 0,
                            timestamp: Date.now(),
                            chainId: 80094,
                        };
                    }

                    // Fetch prices for token0 and token1 from Berachain API
                    const tokenPrices = await getTokenPrices([token0_addr, token1_addr]);

                    const token0_price = tokenPrices.find(
                        (x) => x.address.toLowerCase() === token0_addr.toLowerCase()
                    )?.price;

                    const token1_price = tokenPrices.find(
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

                    // Multiply prices up to get integer price (to avoid floating point issues)
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
                } catch (error) {
                    console.error(`Error calculating price for vault ${token.address}:`, error);
                    throw error;
                }
            })
        );

        return prices;
    }

    /**
     * Get incentive/reward tokens
     * WinnieSwap vaults may have BGT rewards when staked on BeraHub
     * But BGT is already tracked by BeraHub, so we return empty array
     */
    async getIncentiveTokens(): Promise<Token[]> {
        return [];
    }

    /**
     * Get prices for incentive tokens
     * Not needed as BGT prices are already available on BeraHub
     */
    async getIncentiveTokenPrices(): Promise<TokenPrice[]> {
        return [];
    }
}

/**
 * Helper function to get token prices from Berachain API
 */
async function getTokenPrices(addresses: string[]): Promise<TokenPriceData[]> {
    try {
        const response = await fetch(BERACHAIN_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                query: TOKEN_PRICE_QUERY,
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
        console.error("Error fetching token prices:", error);
        throw error;
    }
}
