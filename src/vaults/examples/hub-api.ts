import { gql } from "graphql-request";

const BERACHAIN_API_URL = "https://api.berachain.com/";

interface PoolData {
  address: string;
  dynamicData: {
    totalLiquidity: string;
    totalShares: string;
  };
}

interface TokenAndPrice {
  address: string;
  price: number;
  updatedAt: number;
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

const TOKEN_PRICE_QUERY = gql`
  query ($tokens: [String!]!) {
    tokenGetCurrentPrices(chains: [BERACHAIN], addressIn: $tokens) {
      address
      price
      updatedAt
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

export async function fetchTokenPrice(
  tokens: string[]
): Promise<TokenAndPrice[]> {
  try {
    const response = await fetch(BERACHAIN_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: TOKEN_PRICE_QUERY,
        variables: {
          tokens,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data.tokenGetCurrentPrices;
  } catch (error) {
    console.error("Error fetching token price:", error);
    throw error;
  }
}
