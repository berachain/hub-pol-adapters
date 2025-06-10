import { BaseAdapter, Token, TokenPrice } from "../../types";
import { berachain } from "viem/chains";
import { createPublicClient, http } from "viem";

const BERACHAIN_API_URL = "https://api.berachain.com/graphql";
const IBGT_ADDRESS = "0xac03CABA51e17c86c921E1f6CBFBdC91F8BB2E6b";
const ORIBGT_ADDRESS = "0x69f1E971257419B1E9C405A553f252c64A29A30a";

type TokenPriceData = {
    address: string;
    chain: string;
    price: number;
    updatedAt: BigInteger;
    updatedBy: string;
};

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

export class GoldilocksOribgtVaultAdapter extends BaseAdapter {
    constructor() {
        super({
            name: "GoldilocksOribgtVaultAdapter",
            description:
                "GoldilocksOribgtVaultAdapter is an adapter for the oriBGT Goldivault Liquidity Pool Vault at https://hub.berachain.com/vaults/0xeee277a91f9f50cda5d188522c921820a848cd99/",
            enabled: true,
        });
    }

    async getRewardVaultStakingTokens(): Promise<Token[]> {
        return [
            {
                address: "0xDB78B4166580917c9604f8DdfBea5F49B493845c",
                symbol: "STEERUV20",
                name: "STEER_UNIV3_VAULT_20",
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

        const prices = await Promise.all(
            stakingTokens.map(async (token) => {
                // total supply of steer vault LP token
                const totalSupply = (await publicClient.readContract({
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

                // amount of oribgt and oribgt-ot supplied to LP
                const [totalAmount0, totalAmount1] = (await publicClient.readContract({
                    address: token.address as `0x${string}`,
                    abi: [
                        {
                            type: "function",
                            name: "getTotalAmounts",
                            inputs: [],
                            outputs: [
                                { internalType: "uint256", name: "total0", type: "uint256" },
                                { internalType: "uint256", name: "total1", type: "uint256" },
                            ],
                            stateMutability: "view",
                        },
                    ],
                    functionName: "getTotalAmounts",
                })) as [bigint, bigint];

                // amount of oribgt converted to ibgt amount
                const oribgtAmountInIbgt = (await publicClient.readContract({
                    address: ORIBGT_ADDRESS as `0x${string}`,
                    abi: [
                        {
                            type: "function",
                            name: "convertToAssets",
                            inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
                            outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
                            stateMutability: "view",
                        },
                    ],
                    functionName: "convertToAssets",
                    args: [totalAmount0],
                })) as bigint;

                // amount of oribgt-ot converted to ibgt amount
                const oribgtotAmountInIbgt = (await publicClient.readContract({
                    address: ORIBGT_ADDRESS as `0x${string}`,
                    abi: [
                        {
                            type: "function",
                            name: "convertToAssets",
                            inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
                            outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
                            stateMutability: "view",
                        },
                    ],
                    functionName: "convertToAssets",
                    args: [totalAmount1],
                })) as bigint;

                // price of ibgt
                const prices = await getTokenPrices([IBGT_ADDRESS]);
                const ibgtPrice = prices[0].price * 1e18;

                // ratio of oribgt to oribgt-ot in the pool
                const oribgtOTRatio = Number(totalAmount0) / Number(totalAmount1);

                // oribgt amount in ibgt amount * ibgt price + oribgt ot amount in ibgt amount * oribgt to oribgt ot ratio * ibgt price / lp token total supply
                const price =
                    (Number(oribgtAmountInIbgt) * ibgtPrice +
                        Number(oribgtotAmountInIbgt) * oribgtOTRatio * ibgtPrice) /
                    Number(totalSupply) /
                    1e18;

                return {
                    address: token.address,
                    price,
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
                address: "0x6969696969696969696969696969696969696969",
                name: "Wrapped Bera",
                symbol: "WBERA",
                decimals: 18,
                chainId: 80094,
            },
        ];
    }

    async getIncentiveTokenPrices(_incentiveTokens: Token[]): Promise<TokenPrice[]> {
        return [];
    }
}

async function getTokenPrices(addresses: string[]): Promise<TokenPriceData[]> {
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
        console.error("Error fetching pool data:", error);
        throw error;
    }
}
