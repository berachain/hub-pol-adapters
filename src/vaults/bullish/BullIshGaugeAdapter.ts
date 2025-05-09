import { BaseAdapter, Token, TokenPrice } from "../../types";
import { berachain } from "viem/chains";
import { createPublicClient, http } from "viem";
import { fetchTokenPrice } from "../examples/hub-api";

export class BullIshGaugeAdapter extends BaseAdapter {
    constructor() {
        super({
            name: "BullIshGaugeAdapter",
            description: "Adapter for Bull Ish gauge APR calculations",
            enabled: true,
        });
    }

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
        const publicClient = createPublicClient({
            chain: berachain,
            transport: http("https://rpc.berachain.com"),
        });

        // Get BERA price
        const beraPrices = await fetchTokenPrice(["0x6969696969696969696969696969696969696969"]);
        const beraPrice =
            beraPrices?.find(
                (p) =>
                    p.address.toLowerCase() ===
                    "0x6969696969696969696969696969696969696969".toLowerCase()
            )?.price || 0;

        const prices = await Promise.all(
            stakingTokens.map(async (token) => {
                const _totalSupply = (await publicClient.readContract({
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

    async getIncentiveTokens(): Promise<Token[]> {
        return [
            {
                address: "0x9b6761bf2397Bb5a6624a856cC84A3A14Dcd3fe5",
                symbol: "iBERA",
                name: "Infrared Bera",
                decimals: 18,
                chainId: 80094,
            },
            {
                address: "0xD77552D3849ab4D8C3b189A9582d0ba4C1F4f912",
                symbol: "wgBERA",
                name: "Wrapped gBERA",
                decimals: 18,
                chainId: 80094,
            },
            {
                address: "0x6969696969696969696969696969696969696969",
                symbol: "WBERA",
                name: "Wrapped BERA",
                decimals: 18,
                chainId: 80094,
            },
        ];
    }

    async getIncentiveTokenPrices(): Promise<TokenPrice[]> {
        return [];
    }
}
