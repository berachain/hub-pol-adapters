import { BaseAdapter, Token, TokenPrice } from "../../types";
import { berachain } from "viem/chains";
import { createPublicClient, http } from "viem";

const BERACHAIN_API_URL = "https://api.berachain.com/graphql";

const PRICE_QUERY = `
  query GetTokenPrices($addresses: [String!]!) {
    tokenGetCurrentPrices(addressIn: $addresses, chains: BERACHAIN) {
      address
      chain
      price
      updatedAt
      updatedBy
    }
  }
`;

export class BullIshGaugeAdapter extends BaseAdapter {
    constructor() {
        super({
            name: "BullIshGaugeAdapter",
            description: "Adapter for Bull Ish gauge APR calculations",
            enabled: true,
        });
    }

    /**
     * Get staking tokens from reward vaults
     * These tokens are used to calculate TVL for APR calculations
     */
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

    /**
     * Get prices for staking tokens
     * These prices are used to calculate TVL for APR calculations
     */
    async getRewardVaultStakingTokenPrices(stakingTokens: Token[]): Promise<TokenPrice[]> {
        const publicClient = createPublicClient({
            chain: berachain,
            transport: http("https://rpc.berachain.com"),
        });

        // Get BERA price as this vault token is backed by BERA
        const beraPrice = await getTokenPrices(["0x6969696969696969696969696969696969696969"]);

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

                // Using BERA price as base since users spend BERA to get on the queue
                const beraTokenPrice =
                    beraPrice.find(
                        (x) =>
                            x.address.toLowerCase() ===
                            "0x6969696969696969696969696969696969696969".toLowerCase()
                    )?.price || 0;

                return {
                    address: token.address,
                    price: beraTokenPrice, // BULL-VAULT token is valued in BERA
                    timestamp: Date.now(),
                    chainId: 80094,
                };
            })
        );

        return prices;
    }

    /**
     * Get incentive tokens
     */
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

async function getTokenPrices(
    addresses: string[]
): Promise<Array<{ address: string; price: number }>> {
    try {
        const response = await fetch(BERACHAIN_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                query: PRICE_QUERY,
                variables: {
                    addresses,
                },
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.data.tokenGetCurrentPrices;
    } catch (error) {
        console.error("Error fetching token prices:", error);
        throw error;
    }
}
