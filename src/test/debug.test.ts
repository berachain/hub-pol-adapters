/**
 * Debug test — runs all adapters against real RPC + API and prints every price.
 *
 * Not meant for CI; run manually:
 *   npx vitest run src/test/debug.test.ts --reporter=verbose --timeout=60000
 */
import { describe, it } from "vitest";
import { adapters, type TokenAndPrice, type TokenPriceResult } from "../index";
import { __testUtils } from "../types";

const TIMEOUT = 60_000;

describe("debug: fetch all prices from all adapters", () => {
  for (const AdapterClass of adapters) {
    const adapterName = new AdapterClass().name;

    it(
      `${adapterName}`,
      async () => {
        let prices: TokenAndPrice[] = [];
        const adapter = new AdapterClass({
          getTokenPrices() {
            return Promise.resolve(prices);
          }
        });
        const tokens = await adapter.getTokens();

        prices = await __testUtils.fetchTokenPrices(tokens.map((t) => t.address.toLowerCase()));
        
        console.log(prices);
        const results = await adapter.getTokenPrices(tokens);

        const rows = results.map((r: TokenPriceResult, i: number) => ({
          adapter: adapterName,
          symbol: tokens[i]?.symbol ?? "?",
          address: tokens[i]?.address ?? r.address,
          status: r.status === "fulfilled" ? "✓" : "✗",
          price:
            r.status === "fulfilled"
              ? `$${r.price.toFixed(6)}`
              : `ERROR: ${r.error}`,
        }));

        console.log(`\n${adapterName} (${tokens.length} tokens):`);
        console.table(rows);
      },
      TIMEOUT,
    );
  }
});
