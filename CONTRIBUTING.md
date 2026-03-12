# Contributing

Thanks for helping improve the price adapters! This guide covers everything you need to add a new adapter or modify an existing one.

## Adding a new adapter

### 1. Create the adapter

Create `src/adapters/your-protocol/adapter.ts`:

```typescript
import {
  BasePriceAdapter,
  type Token,
  type TokenPriceResult,
  type PriceQueryOptions,
} from "../../types";

export class YourProtocolAdapter extends BasePriceAdapter {
  readonly name = "YourProtocolAdapter";

  async getTokens(): Promise<Token[]> {
    return [
      {
        address: "0x...",
        symbol: "YOUR-TOKEN",
        name: "Your Protocol Token",
        decimals: 18,
        chainId: 80094,
      },
    ];
  }

  async getTokenPrices(
    tokens: Token[],
    opts?: PriceQueryOptions,
  ): Promise<TokenPriceResult[]> {
    const results = await Promise.allSettled(
      tokens.map(async (token) => {
        // Your pricing logic here.
        // Use this.publicClient for on-chain reads.
        // Use this.fetchTokenPrice() for underlying token prices.
        // Pass opts?.blockNumber to multicall/readContract for historical support.

        const price = 1.0; // replace with actual calculation
        return this.fulfilled(token.address, price);
      }),
    );

    return results.map((r, i) =>
      r.status === "fulfilled"
        ? r.value
        : this.rejected(tokens[i].address, r.reason),
    );
  }
}
```

### 2. Key rules

**Error isolation is mandatory.** Use `Promise.allSettled` in `getTokenPrices` so one token's failure doesn't break the rest. The `this.fulfilled()` and `this.rejected()` helpers build the correct result shape.

**Historical support.** If your adapter does on-chain reads, pass `opts?.blockNumber` to `multicall` / `readContract`:

```typescript
await this.publicClient.multicall({
  contracts: [...],
  ...(opts?.blockNumber ? { blockNumber: opts.blockNumber } : {}),
});
```

For API/DB-sourced prices, `this.fetchTokenPrice(addresses, opts)` passes the options through automatically.

**Token discovery.** `getTokens()` can return hardcoded tokens or discover them dynamically (e.g. from a subgraph). It's up to the adapter.

### 3. Write tests

Create `src/adapters/your-protocol/adapter.test.ts`. Use the mock helpers in `src/test/helpers.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { YourProtocolAdapter } from "./adapter";
import {
  createMockPublicClient,
  createMockGetTokenPrices,
} from "../../test/helpers";

describe("YourProtocolAdapter", () => {
  it("returns correct tokens", async () => {
    const adapter = new YourProtocolAdapter();
    const tokens = await adapter.getTokens();
    expect(tokens.length).toBeGreaterThan(0);
  });

  it("prices tokens correctly", async () => {
    const adapter = new YourProtocolAdapter({
      publicClient: createMockPublicClient({
        multicallResults: [[/* your mock return values */]],
      }),
      getTokenPrices: createMockGetTokenPrices({
        "0x...": 5.0,
      }),
    });

    const tokens = await adapter.getTokens();
    const results = await adapter.getTokenPrices(tokens);

    expect(results[0].status).toBe("fulfilled");
  });

  it("isolates errors per token", async () => {
    // Verify that if one token fails, others still succeed
  });
});
```

Every adapter should test at minimum:

- `getTokens()` returns the expected tokens
- Price math is correct given mock on-chain data
- Errors are isolated (one token fails, others succeed)
- Edge cases (zero totalSupply, missing prices)

### 4. Export the adapter

Add your adapter to `src/index.ts`:

```typescript
export { YourProtocolAdapter } from "./adapters/your-protocol/adapter";

// and add it to the adapters array:
import { YourProtocolAdapter } from "./adapters/your-protocol/adapter";

export const adapters = [
  // ...existing adapters
  YourProtocolAdapter,
] as const satisfies (typeof BasePriceAdapter)[];
```

### 5. Verify everything

```bash
npm test              # all unit tests pass
npx tsc --noEmit      # no type errors
npm run build         # builds cleanly
npm run lint          # no lint errors
npm run format        # code is formatted
```

### 6. Run the debug test

Confirm your adapter works against real RPC:

```bash
npx vitest run src/test/debug.test.ts --reporter=verbose --timeout=60000
```

## When you don't need an adapter

You don't need to add a token here if its price is already available through:

- A Hub Pool or Kodiak pool (Hub already knows the price)
- Coingecko — just add your token to the [Berachain Metadata repo](https://github.com/berachain/metadata/blob/main/src/tokens/mainnet.json) with the Coingecko ID

Adapters are for tokens whose prices require custom on-chain computation (LP tokens, vault shares, wrapped/pegged derivatives).

## Submitting a PR

1. Fork or clone the repo
2. Create a branch: `git checkout -b feat/your-adapter`
3. Implement the adapter + tests
4. Run all checks (test, typecheck, build, lint, format)
5. Push and open a PR

Keep PRs focused — one adapter per PR makes review easier.
