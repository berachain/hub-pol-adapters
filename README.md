# Hub Price Adapters

Token price adapters for [Berachain](https://berachain.com/). Each adapter knows how to compute prices for a specific set of tokens — LP tokens, vault shares, or any on-chain derivative — and exposes them through a simple, uniform API.

The backend uses these adapters to feed prices into reward vault APR calculations, but the library itself is protocol-agnostic: it's a price source, nothing else.

## Quick start

```bash
npm install
npm test            # unit tests (vitest)
npm run build       # tsup → dist/
```

## API

Every adapter extends `BasePriceAdapter` and implements two methods:

```typescript
import { BasePriceAdapter, Token, TokenPriceResult, PriceQueryOptions } from "@berachain/hub-pol-adapters";

class MyAdapter extends BasePriceAdapter {
  readonly name = "MyAdapter";

  async getTokens(): Promise<Token[]> {
    // Return the tokens this adapter can price.
    // Can be hardcoded or discovered dynamically (e.g. from a subgraph).
  }

  async getTokenPrices(
    tokens: Token[],
    opts?: PriceQueryOptions,
  ): Promise<TokenPriceResult[]> {
    // Price each token independently using Promise.allSettled.
    // One failure must not affect other tokens.
  }
}
```

### Consumer usage

```typescript
import { SxVaultAdapter } from "@berachain/hub-pol-adapters";

const adapter = new SxVaultAdapter({
  // Optional: inject a custom price source (e.g. DB lookup in the backend)
  getTokenPrices: async (addresses, opts) => {
    return db.getTokenPrices(addresses, opts?.timestamp);
  },
});

const tokens = await adapter.getTokens();
const prices = await adapter.getTokenPrices(tokens);

for (const r of prices) {
  if (r.status === "fulfilled") {
    console.log(`${r.address}: $${r.price}`);
  } else {
    console.error(`${r.address}: ${r.error}`);
  }
}
```

### Historical prices

Pass `PriceQueryOptions` to query at a specific point in time:

```typescript
// By block number — on-chain reads use this block for multicall/readContract
await adapter.getTokenPrices(tokens, { blockNumber: 12345678n });

// By timestamp — passed through to the injected getTokenPrices function (e.g. DB lookup)
await adapter.getTokenPrices(tokens, { timestamp: 1710000000000 });
```

Not every adapter supports both modes. If a mode isn't supported, the result for that token will be `rejected` with a clear error.

### Error handling

`getTokenPrices` returns a `TokenPriceResult[]` — a discriminated union:

```typescript
type TokenPriceResult =
  | { status: "fulfilled"; address: string; price: number; timestamp: number; source: string }
  | { status: "rejected";  address: string; error: string; source: string };
```

Adapters use `Promise.allSettled` internally so a failure for one token never takes down another.

## Types

| Type | Description |
|---|---|
| `Token` | ERC-20 token metadata (address, symbol, name, decimals, chainId) |
| `TokenPriceResult` | Fulfilled price or rejected error, per token |
| `PriceQueryOptions` | Optional `blockNumber` and/or `timestamp` for historical queries |
| `GetTokenPrices` | Signature for the injected price-fetching function |
| `PriceAdapterConfig` | Constructor config: `publicClient` + `getTokenPrices` |

## Adapters

| Adapter | Protocol | Pricing strategy |
|---|---|---|
| `AquaBeraAdapter` | AquaBera | LP price from Kodiak V3 `getTotalAmounts` |
| `BrownFiVaultAdapter` | BrownFi | LP price from token balances + decimals |
| `BullIshGaugeAdapter` | Bull Ish | Vault token pegged to WBERA |
| `ConcreteVaultAdapter` | Concrete | Vault share price from `totalAssets / totalSupply` |
| `IVXVaultAdapter` | IVX | LP price from multi-token TVL / supply |
| `SolvBTCBeraVaultAdapter` | Solv | 1:1 peg to SolvBTC |
| `SxVaultAdapter` | SX Bet | 1:1 peg to WBERA (BGT) |
| `WinnieSwapAdapter` | WinnieSwap | Dynamic vault discovery via GraphQL + LP pricing |

## Testing

```bash
npm test                 # run all unit tests
npm run test:watch       # watch mode
npm run test:coverage    # with coverage report
```

### Debug test

Runs every adapter against real RPC + Berachain API and prints a price table:

```bash
npx vitest run src/test/debug.test.ts --reporter=verbose --timeout=60000
```

## Project structure

```
src/
├── types/                  # Token, TokenPriceResult, BasePriceAdapter
├── adapters/
│   ├── aquabera/
│   │   ├── adapter.ts
│   │   └── adapter.test.ts
│   ├── brownfi/
│   ├── bullish/
│   ├── concrete/
│   ├── ivx/
│   ├── solv/
│   ├── sx/
│   └── winnieswap/
├── utils/                  # Shared ABIs
├── test/
│   ├── helpers.ts          # Mock factories for unit tests
│   └── debug.test.ts       # Live integration test
└── index.ts                # Public exports
```

## License

MIT — see [LICENSE](./LICENSE).
