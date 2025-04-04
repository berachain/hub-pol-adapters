import { BaseAdapter, Token, TokenPrice } from "../types";
import * as path from "path";

async function run(testFile: string) {
  try {
    // Resolve the absolute path to the file
    const absolutePath = path.resolve(process.cwd(), testFile);
    console.log(`Loading adapter from: ${absolutePath}`);

    // Dynamically import the adapter from the provided file path
    const adapterModule = await import(absolutePath);

    // Get the first exported class that extends BaseAdapter
    const AdapterClass = Object.values(adapterModule).find(
      (exported) =>
        typeof exported === "function" &&
        exported.prototype instanceof BaseAdapter
    );

    if (!AdapterClass) {
      throw new Error(`No adapter class found in ${testFile}`);
    }

    // Instantiate the adapter - we need to cast to any to bypass the abstract class check
    // since we know the actual class will be a concrete implementation
    const adapter = new (AdapterClass as any)({ name: "Test Adapter" });

    // Get staking tokens and their prices
    const tokens = await adapter.getRewardVaultStakingTokens();
    const prices = await adapter.getRewardVaultStakingTokenPrices(tokens);
    for (const price of prices) {
      const token = tokens.find((t: Token) => t.address === price.address);
      console.log(`Staking token ${token?.symbol}: $${price.price}`);
    }

    // Get incentive tokens and their prices
    const incentiveTokens = await adapter.getIncentiveTokens();
    const incentivePrices =
      await adapter.getIncentiveTokenPrices(incentiveTokens);
    for (const price of incentivePrices) {
      const token = incentiveTokens.find(
        (t: Token) => t.address === price.address
      );
      console.log(`Incentive token ${token?.symbol}: $${price.price}`);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error running adapter test: ${errorMessage}`);
    process.exit(1);
  }
}

// Get the filename from command line arguments
const args = process.argv.slice(2);
const testFile = args[0];

if (!testFile) {
  console.error("Please provide a path to the adapter file");
  console.error("Usage: npm run test:adapter -- <path-to-adapter-file>");
  process.exit(1);
}

// Run the test with the provided filename
run(testFile);
