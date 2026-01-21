import { http, createPublicClient, PublicClient } from "viem";
import { berachain } from "viem/chains";
import { gql } from "graphql-request";

interface TokenAndPrice {
    address: string;
    price: number;
    updatedAt: number;
}

export interface Token {
    address: `0x${string}`;
    symbol: string;
    name: string;
    decimals: number;
    chainId: number;
}

export interface TokenPrice {
    address: `0x${string}`;
    price: number;
    timestamp: number;
    chainId: number;
}

export type GetTokenPrices = (tokens: string[]) => Promise<TokenAndPrice[]>;

/**
 * Base adapter class that all protocol adapters must extend
 * Each protocol implements these methods to interact with their token ecosystem
 */
export abstract class BaseAdapter {
    abstract readonly name: string;
    abstract readonly description?: string;
    enabled: boolean = true;

    protected publicClient: PublicClient;
    protected berachainApiUrl: string;
    
    private getTokenPrices?: GetTokenPrices;

    constructor(config: { publicClient?: PublicClient; berachainApiUrl?: string, 
        /**
         * Function to get token prices from an external source
         * If not provided, the adapter will use the Berachain API to get token prices
         */
        getTokenPrices?: GetTokenPrices } = {}) {
        this.publicClient =
            config.publicClient ??
            createPublicClient({
                chain: berachain,
                transport: http("https://rpc.berachain.com"),
            });
        this.berachainApiUrl = config.berachainApiUrl ?? "https://api.berachain.com/";
        this.getTokenPrices = config.getTokenPrices;
    }

    /**
     * Get staking tokens from reward vaults that you want to support APR calculations
     * @returns Promise resolving to list of tokens
     */
    abstract getRewardVaultStakingTokens(): Promise<Token[]>;

    /**
     * Get prices for staking tokens in reward vaults. These prices will be used to determine TVL in the reward vaults
     * i.e. if your staking token is a LP token of a pool, the price is usually TVL of the pool / lp token supply
     * @returns Promise resolving to list of token prices
     */
    abstract getRewardVaultStakingTokenPrices(stakingTokens: Token[]): Promise<TokenPrice[]>;

    /**
     * Get incentive/reward tokens available in the protocol
     * @returns Promise resolving to list of tokens
     */
    abstract getIncentiveTokens(): Promise<Token[]>;

    /**
     * Get prices for incentive tokens. These prices will be used to determine total usd value of incentives as well as BGT APRs
     * DO NOT include staking tokens in this list
     * NO NEED to include incentive tokens that already have prices on https://hub.berachain.com/vaults
     * @returns Promise resolving to list of token prices
     */
    abstract getIncentiveTokenPrices(incentiveTokens: Token[]): Promise<TokenPrice[]>;

    TOKEN_PRICE_QUERY = gql`
        query ($tokens: [String!]!) {
            tokenGetCurrentPrices(chains: [BERACHAIN], addressIn: $tokens) {
                address
                price
                updatedAt
            }
        }
    `;

    async queryBerachainAPI(query: string, variables: Record<string, unknown>) {
        return await fetch(this.berachainApiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ query, variables }),
        });
    }

    async fetchTokenPrice(tokens: string[]): Promise<TokenAndPrice[]> {
        if (this.getTokenPrices) {
            return await this.getTokenPrices(tokens);
        }

        try {
            const response = await this.queryBerachainAPI(this.TOKEN_PRICE_QUERY, {
                tokens,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.data.tokenGetCurrentPrices;
        } catch (error) {
            console.error("Error fetching token price:", error);
            throw error;
        }
    }
}
