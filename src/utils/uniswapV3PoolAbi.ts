import { erc20Abi } from "viem";

export const uniswapV3PoolAbi = [
    ...erc20Abi,
    {
        type: "function",
        name: "token0",
        inputs: [],
        outputs: [{ type: "address" }],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "token1",
        inputs: [],
        outputs: [{ type: "address" }],
        stateMutability: "view",
    },
] as const;
