import { createPublicClient, http } from "viem";
import { berachain } from "viem/chains";

export const publicClient = createPublicClient({
    chain: berachain,
    transport: http(),
});

export default publicClient;
