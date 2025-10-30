# WinnieSwap Sticky Vaults Adapter

## Overview

This adapter enables BeraHub to discover and price WinnieSwap Sticky Vault LP tokens for accurate APR calculations on the BeraHub platform.

## What is WinnieSwap?

WinnieSwap is a DeFi protocol on Berachain featuring automated liquidity management through **Sticky Vaults**. Sticky Vaults combine Uniswap V3's concentrated liquidity with Arrakis V1's automated vault management architecture.

## Data Sources

- **Subgraph**: https://sub.winnieswap.com/
- **RPC**: https://rpc.berachain.com (via viem)
- **Token Prices**: Berachain API (https://api.berachain.com/graphql)

## How It Works

### 1. Fetching Vaults

The adapter queries the WinnieSwap subgraph to retrieve all active Sticky Vaults:

```graphql
query GetStickyVaults {
    stickyVaults {
        items {
            id # Vault contract address
            name # Vault name (e.g., "Sticky Vault WBERA-HONEY-0.05%")
            pool # Underlying Uniswap V3 pool address
        }
    }
}
```

### 2. Calculating LP Token Prices

For each vault, the adapter:

1. Calls `totalSupply()` on the vault contract
2. Calls `getUnderlyingBalances()` to get amount0 and amount1
3. Calls `token0()` and `token1()` to get underlying token addresses
4. Fetches token prices from Berachain API
5. Calculates vault LP token price:

```
price = (amount0 × price0 + amount1 × price1) / totalSupply
```

This represents the TVL of the vault divided by the total LP token supply.

### 3. Incentive Tokens

WinnieSwap vaults do not require custom incentive token pricing as BGT rewards are already handled by BeraHub.

## Testing

```bash
npm run test:adapter -- src/vaults/winnieswap/WinnieSwapAdapter.ts
```

Expected output: 29+ vaults with their calculated LP token prices.

## Configuration

**No environment variables required** - all URLs are hardcoded for production use.

## Active Vaults (as of deployment)

The adapter automatically discovers all vaults from the subgraph, including:

- WBERA-HONEY (0.05%)
- WBTC-WETH (0.05%)
- USDC.e-HONEY (0.01%)
- And 26+ more active vaults

## Links

- **Website**: https://winnieswap.com
- **Subgraph**: https://sub.winnieswap.com/
- **Documentation**: https://github.com/winnieswap (if available)
