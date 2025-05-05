# Hub PoL Adapter

This repository contains adapters for discovering token prices from various DeFi protocols. These adapters are specifically designed to fetch token prices for reward vault staking tokens and incentive tokens, which are essential for correctly calculating APRs (Annual Percentage Rates) displayed on [Berachain Reward Vaults](https://hub.berachain.com/vaults/).

## Overview

The adapters in this repository follow a common interface defined by the `BaseAdapter` class. Each adapter is responsible for:

1. Fetching staking tokens from reward vaults
2. Getting prices for these staking tokens (used to calculate TVL and BGT APRs)
3. Retrieving incentive/reward tokens
4. Obtaining prices for incentive tokens (used to calculate reward rate and boost APRs)

This standardized approach allows for consistent and accurate APR calculations across different protocols by ensuring all token prices are properly discovered.

## When You Don't Need an Adapter

### Staking Tokens

You **do not need** to add your vault here if your vault's underlying staking token:

- Comes from a Pool created in Hub
- Comes from Kodiak Island
- Comes from Kodiak V2

In these cases, Hub already has the necessary price information for these tokens.

### Incentive Tokens

You **do not need** to implement the `getIncentiveTokenPrices` function if your token is already:

- Listed on Hub
- Listed on Kodiak

If your token is not listed on Hub or Kodiak but is tracked by Coingecko:

1. Add your token information to the [Berachain Metadata repo](https://github.com/berachain/metadata/blob/main/src/tokens/mainnet.json) with the Coingecko ID
2. Hub will automatically fetch your token prices using the Coingecko API

## Installation

```bash
# Install dependencies
npm install
```

## Usage

### Testing an Adapter

To test an adapter, use the following command:

```bash
npm run test:adapter -- <path-to-adapter-file>
```

For example:

```bash
npm run test:adapter -- src/vaults/examples/wbera-lbgt-vault-adapter.ts
```

This will:

1. Load the adapter from the specified file
2. Execute the adapter's methods to fetch token information and prices
3. Display the results in the console

## Writing Your Own Adapter

To create a new adapter for a specific protocol, follow these steps:

### 1. Create a New File

Create a new TypeScript file in the appropriate directory, e.g., `src/vaults/your-protocol/your-adapter.ts`.

### 2. Implement the BaseAdapter Interface

Your adapter must extend the `BaseAdapter` class and implement all required methods:

```typescript
import { BaseAdapter, Token, TokenPrice } from "../../types";

export class YourProtocolAdapter extends BaseAdapter {
  constructor() {
    super({
        name: "Give a name",
        description?: "Give a description",
        enabled?: true,
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
        address: "0xv1...",
        symbol: "VAULT1-LP-TOKEN",
        name: "Vault1 LP Token",
        decimals: 18,
        chainId: 80094,
      },
      {
        address: "0xv2...",
        symbol: "VAULT2-LP-TOKEN",
        name: "Vault2 LP Token",
        decimals: 18,
        chainId: 80094,
      },
    ];
  }

  /**
   * Get prices for staking tokens
   * These prices are used to calculate TVL for APR calculations
   */
  async getRewardVaultStakingTokenPrices(
    stakingTokens: Token[]
  ): Promise<TokenPrice[]> {
    // Implement to return token prices
    // Example:
    return [
      {
        address: "0xv1...",
        price: 1.23,
        timestamp: Date.now(),
      },
      {
        address: "0xv2...",
        price: 4.56,
        timestamp: Date.now(),
      },
    ];
  }

  /**
   * Get incentive/reward tokens
   * These tokens are used to calculate reward value for APR calculations
   */
  async getIncentiveTokens(): Promise<Token[]> {
    // Implement to return incentive tokens
    return [];
  }

  /**
   * Get prices for incentive tokens
   * These prices are used to calculate reward value for APR calculations
   *
   * Note: You don't need to implement this if your token is already listed on Hub or Kodiak,
   * or if it's tracked by Coingecko (in which case, add it to the Berachain Metadata repo)
   */
  async getIncentiveTokenPrices(
    incentiveTokens: Token[]
  ): Promise<TokenPrice[]> {
    // Implement to return incentive token prices
    return [];
  }
}
```

### 3. Key Implementation Details

#### Token Structure

Each token should have the following properties:

- `address`: The token's contract address
- `symbol`: The token's symbol
- `name`: The token's full name
- `decimals`: The number of decimal places for the token
- `chainId`: 80094

#### Token Price Structure

Each token price should have:

- `address`: The token's contract address (matching the token object)
- `price`: The price in USD
- `timestamp`: When the price was fetched (in milliseconds)

#### Important Notes for APR Calculations

- For staking tokens that are LP tokens, the price should represent the TVL of the pool divided by the LP token supply
- For incentive tokens, only include tokens that don't already have prices on <https://hub.berachain.com/vaults>
- Accurate token prices are critical for correct APR calculations
- Make sure to handle errors gracefully and provide meaningful error messages

### 4. Testing Your Adapter

After implementing your adapter, test it using the command:

```bash
npm run test:adapter -- src/vaults/your-protocol/your-adapter.ts
```

### 5. Include Your Adapter in Package Exports

Export your package class in `src/index.ts` to ensure that it is importable by the users of this package.

```typescript
// ...
// add your adapter to the imports
import { YourProtocolAdapter } from "./vaults/your-protocol/YourProtocolAdapter";

// add it to the list of exports
export { ..., YourProtocolAdapter };
```

### 6. Get ready to merge

Make sure your branch is ready for merging! Be sure to build everything locally with `npm build`, lint with `npm run lint` and format with `npm run format`. We run CI checks before merging, so doing these steps will save everyone time.

## Project Structure

```text
src/
├── types/              # Type definitions and interfaces
├── utils/              # Utility functions and test scripts
└── vaults/             # Adapter implementations
    ├── examples/       # Example adapters
    └── your-protocol/  # Your custom adapters
```

## Contributing

1. Fork or clone the repository
2. Create a feature branch: `git checkout -b feature/your-adapter`
3. Implement your adapter
4. Test your adapter
5. Commit your changes: `git commit -m 'Add adapter for Your Protocol'`
6. Push the commit: `git push origin feature/your-adapter`
7. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
