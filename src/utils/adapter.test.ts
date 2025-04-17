import { BaseAdapter, Token } from "../types";
import path from "path";
import fs from "fs";

async function main() {
    // Get the filename from command line arguments
    const args = process.argv.slice(2);
    const testFile = args[0];
    const runAll = testFile === "all";

    if (!runAll && !testFile) {
        console.error(
            "Please provide a path to the adapter file or 'all' to run tests for all adapters"
        );
        console.error("Usage: npm run test:adapter -- <path-to-adapter-file>");
        process.exit(1);
    }

    const adapterSrcFiles = runAll
        ? getAllFiles("./src/vaults").filter((file) => file.endsWith(".ts"))
        : [testFile];
    const adapterImportPaths = adapterSrcFiles.map(
        (file) => `../vaults/${file.split("src/vaults/").reverse()[0]}`
    );
    const loadAdapters = await loadAdapterClasses(adapterImportPaths);

    // Run the test with the provided classes
    run(loadAdapters);
}

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
    const files = fs.readdirSync(dirPath);

    files.forEach((file) => {
        const filePath = path.join(dirPath, file);
        if (fs.statSync(filePath).isDirectory()) {
            arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
        } else {
            arrayOfFiles.push(filePath);
        }
    });

    return arrayOfFiles;
}

async function loadAdapterClasses(filePaths: string[]): Promise<(typeof BaseAdapter)[]> {
    const derivedClasses: (typeof BaseAdapter)[] = [];

    try {
        // Import each file and check for classes extending BaseClass
        for (const file of filePaths) {
            const module = await import(file);

            // Inspect each export to see if it's a class extending BaseClass
            Object.values(module).forEach((exportedItem) => {
                if (
                    typeof exportedItem === "function" &&
                    exportedItem.prototype instanceof BaseAdapter
                ) {
                    derivedClasses.push(exportedItem as typeof BaseAdapter);
                }
            });
        }

        return derivedClasses;
    } catch (error) {
        console.error("Error loading derived classes:", error);
        return [];
    }
}

async function run(adapters: (typeof BaseAdapter)[]) {
    for (const AdapterClass of adapters) {
        // Instantiate the adapter - we need to cast to any to bypass the abstract class check
        // since we know the actual class will be a concrete implementation
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const adapter = new (AdapterClass as any)();

        console.log("\n" + "=".repeat(50));
        console.log(`Adapter: ${AdapterClass.name}`);
        console.log("=".repeat(50));

        // Get staking tokens and their prices
        const tokens = await adapter.getRewardVaultStakingTokens();
        const prices = await adapter.getRewardVaultStakingTokenPrices(tokens);

        if (prices.length > 0) {
            console.log("\nStaking Tokens:");
            console.log("-".repeat(30));
            for (const price of prices) {
                const token = tokens.find((t: Token) => t.address === price.address);
                console.log(`  ${token?.symbol}: $${price.price.toFixed(6)}`);
            }
        }

        // Get incentive tokens and their prices
        const incentiveTokens = await adapter.getIncentiveTokens();
        const incentivePrices = await adapter.getIncentiveTokenPrices(incentiveTokens);

        if (incentivePrices.length > 0) {
            console.log("\nIncentive Tokens:");
            console.log("-".repeat(30));
            for (const price of incentivePrices) {
                const token = incentiveTokens.find((t: Token) => t.address === price.address);
                console.log(`  ${token?.symbol}: $${price.price.toFixed(6)}`);
            }
        }
    }
    console.log("\n" + "=".repeat(50) + "\n");
}

main();
