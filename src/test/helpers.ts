import { vi } from "vitest";
import type { PublicClient } from "viem";
import type { GetTokenPrices, TokenAndPrice } from "../types";

/**
 * Creates a mock PublicClient with configurable multicall and readContract responses.
 */
export function createMockPublicClient(overrides: {
  multicallResults?: unknown[][];
  readContractResult?: unknown;
} = {}): PublicClient {
  let multicallCallIndex = 0;

  return {
    multicall: vi.fn().mockImplementation(() => {
      const results = overrides.multicallResults?.[multicallCallIndex];
      multicallCallIndex++;
      if (results === undefined) {
        throw new Error(
          `No multicall result configured for call index ${multicallCallIndex - 1}`,
        );
      }
      return Promise.resolve(results);
    }),
    readContract: vi.fn().mockImplementation(() => {
      return Promise.resolve(overrides.readContractResult ?? 0n);
    }),
  } as unknown as PublicClient;
}

/**
 * Creates a mock getTokenPrices function that returns configurable prices.
 */
export function createMockGetTokenPrices(
  priceMap: Record<string, number>,
): GetTokenPrices {
  return vi.fn().mockImplementation(async (tokens: string[]) => {
    return tokens
      .map((addr) => {
        const price = priceMap[addr.toLowerCase()];
        if (price === undefined) return null;
        return {
          address: addr,
          price,
          updatedAt: Date.now(),
        } satisfies TokenAndPrice;
      })
      .filter((x): x is TokenAndPrice => x !== null);
  });
}

/**
 * Creates a mock getTokenPrices that always rejects.
 */
export function createFailingGetTokenPrices(errorMsg = "API error"): GetTokenPrices {
  return vi.fn().mockRejectedValue(new Error(errorMsg));
}
