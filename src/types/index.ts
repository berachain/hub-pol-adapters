import { http, createPublicClient, type PublicClient } from "viem";
import { berachain } from "viem/chains";

/**
 * Represents an ERC20 token on Berachain.
 */
export interface Token {
  address: `0x${string}`;
  symbol: string;
  name: string;
  decimals: number;
  chainId: number;
}

/**
 * A successfully resolved token price.
 */
export interface TokenPriceFulfilled {
  status: "fulfilled";
  address: `0x${string}`;
  price: number;
  /** Millisecond timestamp of when the price was determined */
  timestamp: number;
  /** Which adapter produced this price */
  source: string;
}

/**
 * A token price that failed to resolve.
 */
export interface TokenPriceRejected {
  status: "rejected";
  address: `0x${string}`;
  error: string;
  /** Which adapter attempted to produce this price */
  source: string;
}

export type TokenPriceResult = TokenPriceFulfilled | TokenPriceRejected;

/**
 * Shape returned by external price lookups (API or DB).
 */
export interface TokenAndPrice {
  address: string;
  price: number;
  updatedAt: number;
}

/**
 * Options for historical price queries.
 *
 * - `blockNumber`: used for on-chain reads at a specific block (viem multicall/readContract)
 * - `timestamp`: used for API/DB lookups at a specific point in time (ms)
 *
 * At most one should be provided. If neither is set, current prices are fetched.
 */
export interface PriceQueryOptions {
  blockNumber?: bigint;
  timestamp?: number;
}

/**
 * Signature for the external price-fetching function.
 * The backend injects a DB-backed implementation; the default falls back to the Berachain API.
 */
export type GetTokenPrices = (
  tokens: string[],
  opts?: PriceQueryOptions,
) => Promise<TokenAndPrice[]>;

export interface PriceAdapterConfig {
  publicClient?: PublicClient;
  /**
   * External price source. If not provided, the adapter uses the Berachain API
   * (which only supports current prices).
   */
  getTokenPrices?: GetTokenPrices;
}

const TOKEN_PRICE_QUERY = `
  query ($tokens: [String!]!) {
    tokenGetCurrentPrices(chains: [BERACHAIN], addressIn: $tokens) {
      address
      price
      updatedAt
    }
  }
`;

/**
 * Base class for all price adapters. Subclasses declare the tokens they handle
 * and implement the pricing logic.
 */
export abstract class BasePriceAdapter {
  abstract readonly name: string;

  protected publicClient: PublicClient;
  protected berachainApiUrl: string = "https://api.berachain.com/";

  private _getTokenPrices?: GetTokenPrices;

  constructor(config: PriceAdapterConfig = {}) {
    this.publicClient =
      config.publicClient ??
      createPublicClient({
        chain: berachain,
        transport: http("https://rpc.berachain.com"),
      });
    this._getTokenPrices = config.getTokenPrices;
  }

  /**
   * Returns the list of tokens this adapter can price.
   * May be hardcoded or dynamically discovered (e.g. via a subgraph).
   */
  abstract getTokens(): Promise<Token[]>;

  /**
   * Compute prices for the given tokens. Each token resolves independently —
   * a failure for one token does not affect others.
   *
   * Adapters should use `Promise.allSettled` internally to isolate errors.
   *
   * @param tokens - Tokens to price (typically the result of `getTokens()`)
   * @param opts   - Optional: query at a specific block or timestamp
   */
  abstract getTokenPrices(
    tokens: Token[],
    opts?: PriceQueryOptions,
  ): Promise<TokenPriceResult[]>;

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /**
   * Fetch prices for underlying / reference tokens from the external source
   * (injected `getTokenPrices` function) or from the Berachain API.
   */
  protected async fetchTokenPrice(
    tokens: string[],
    opts?: PriceQueryOptions,
  ): Promise<TokenAndPrice[]> {
    if (this._getTokenPrices) {
      return this._getTokenPrices(tokens, opts);
    }

    // Fallback: Berachain API (current prices only)
    const response = await fetch(this.berachainApiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: TOKEN_PRICE_QUERY, variables: { tokens } }),
    });

    if (!response.ok) {
      throw new Error(
        `Berachain API error: HTTP ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    return data.data.tokenGetCurrentPrices;
  }

  /**
   * Helper to build a fulfilled result.
   */
  protected fulfilled(
    address: `0x${string}`,
    price: number,
    timestamp?: number,
  ): TokenPriceFulfilled {
    return {
      status: "fulfilled",
      address,
      price,
      timestamp: timestamp ?? Date.now(),
      source: this.name,
    };
  }

  /**
   * Helper to build a rejected result.
   */
  protected rejected(
    address: `0x${string}`,
    error: unknown,
  ): TokenPriceRejected {
    return {
      status: "rejected",
      address,
      error: error instanceof Error ? error.message : String(error),
      source: this.name,
    };
  }
}
