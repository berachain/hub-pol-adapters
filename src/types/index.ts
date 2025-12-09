import { http, createPublicClient, PublicClient } from "viem";
import { berachain } from "viem/chains";

export interface Token {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    chainId: number;
}

export interface TokenPrice {
    address: string;
    price: number;
    timestamp: number;
    chainId: number;
}

/**
 * Base adapter class that all protocol adapters must extend
 * Each protocol implements these methods to interact with their token ecosystem
 */
export abstract class BaseAdapter {
    abstract readonly name: string;
    abstract readonly description?: string;
    enabled: boolean = true;

    protected publicClient: PublicClient;

    constructor(config: { publicClient?: PublicClient } = {}) {
        this.publicClient =
            config.publicClient ??
            createPublicClient({
                chain: berachain,
                transport: http("https://rpc.berachain.com"),
            });
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
}
