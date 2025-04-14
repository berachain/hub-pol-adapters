import { gql } from "graphql-request";

const BERACHAIN_API_URL = "https://api.berachain.com/graphql";

interface PoolData {
    address: string;
    dynamicData: {
        totalLiquidity: string;
        totalShares: string;
    };
}

const POOL_QUERY = gql`
    query GetPoolData($addresses: [String!]!) {
        poolGetPools(where: { addressIn: $addresses }) {
            address
            dynamicData {
                totalLiquidity
                totalShares
            }
        }
    }
`;

export async function fetchPoolData(addresses: string[]): Promise<PoolData[]> {
    try {
        const response = await fetch(BERACHAIN_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                query: POOL_QUERY,
                variables: {
                    addresses,
                },
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.data.poolGetPools;
    } catch (error) {
        console.error("Error fetching pool data:", error);
        throw error;
    }
}
