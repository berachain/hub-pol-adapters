import { BaseAdapter, Token, TokenPrice } from "../../types";

export class BullIshGaugeAdapter extends BaseAdapter {
    readonly name = "BullIshGaugeAdapter";
    readonly description = "Adapter for Bull Ish gauge APR calculations";

    async getRewardVaultStakingTokens(): Promise<Token[]> {
        return [
            {
                address: "0xdDD3Ea5De9c70973E224D938B8f392EC4CC0171C",
                symbol: "BULL-VAULT",
                name: "Bull Ish Vault Token",
                decimals: 18,
                chainId: 80094,
            },
        ];
    }

    async getRewardVaultStakingTokenPrices(stakingTokens: Token[]): Promise<TokenPrice[]> {
        // Get BERA price
        const beraPrices = await this.fetchTokenPrice([
            "0x6969696969696969696969696969696969696969",
        ]);
        const beraPrice =
            beraPrices?.find(
                (p) =>
                    p.address.toLowerCase() ===
                    "0x6969696969696969696969696969696969696969".toLowerCase()
            )?.price || 0;

        const prices = await Promise.all(
            stakingTokens.map(async (token) => {
                const _totalSupply = (await this.publicClient.readContract({
                    address: token.address as `0x${string}`,
                    abi: [
                        {
                            type: "function",
                            name: "totalSupply",
                            inputs: [],
                            outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
                            stateMutability: "view",
                        },
                    ],
                    functionName: "totalSupply",
                })) as bigint;

                if (_totalSupply === 0n)
                    throw new Error(`Failed to fetch data for ${token.address}: totalSupply is 0`);

                return {
                    address: token.address,
                    price: beraPrice,
                    timestamp: Date.now(),
                    chainId: 80094,
                };
            })
        );

        return prices;
    }
}
