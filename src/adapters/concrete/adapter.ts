import {
  BasePriceAdapter,
  type Token,
  type TokenPriceResult,
  type PriceQueryOptions,
} from "../../types";

interface ConcreteVault {
  vaultAddress: `0x${string}`;
  stakingToken: Token;
  incentiveToken: Token;
  funded: boolean;
}

const totalSupplyAbi = [
  {
    type: "function",
    name: "totalSupply",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
] as const;

const totalAssetsAbi = [
  {
    type: "function",
    name: "totalAssets",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
] as const;

const concreteVaults: ConcreteVault[] = [
  {
    vaultAddress: "0xe49Ff31B2B3Fd346b0d1832d9fE224ee0d1c1F9e",
    stakingToken: {
      address: "0x310532d9d047c5972cd60852c1a4b675edc55fad",
      name: "Concrete Berabaddies HONEY Vault Token",
      symbol: "ctBeraBaddiesHONEY",
      decimals: 18,
      chainId: 80094,
    },
    incentiveToken: {
      address: "0xFCBD14DC51f0A4d49d5E53C2E0950e0bC26d0Dce",
      name: "Honey (HONEY)",
      symbol: "HONEY",
      decimals: 18,
      chainId: 80094,
    },
    funded: true,
  },
  {
    vaultAddress: "0xA15E1De8a220Ca9C63DB4E8a1E9043fb953B3713",
    stakingToken: {
      address: "0x6e0a95f6ac86ead002d58c83fc1b5a712ee9be7c",
      name: "Concrete Berabaddies BERA Vault Token",
      symbol: "ctBeraBaddiesWBERA",
      decimals: 18,
      chainId: 80094,
    },
    incentiveToken: {
      address: "0x6969696969696969696969696969696969696969",
      name: "Wrapped Bera (WBERA)",
      symbol: "WBERA",
      decimals: 18,
      chainId: 80094,
    },
    funded: true,
  },
  {
    vaultAddress: "0x49BEE393825BBAC404fEfE6E24f34854f30905D2",
    stakingToken: {
      address: "0xf59e889f55777cd5a8dddca918500c5d062c8a57",
      name: "Concrete Berachain Ethereum Vault Token",
      symbol: "ctBeraETH",
      decimals: 18,
      chainId: 80094,
    },
    incentiveToken: {
      address: "0x6fc6545d5cDE268D5C7f1e476D444F39c995120d",
      name: "Berachain Staked ETH (beraETH)",
      symbol: "beraETH",
      decimals: 18,
      chainId: 80094,
    },
    funded: false,
  },
  {
    vaultAddress: "0x127BF6361ff7495F2A69d83d9Ad2092D3dfEE7Ab",
    stakingToken: {
      address: "0x040f89fcbae6ce2b3fbe47fc84b1248c91d716c2",
      name: "Concrete Berachain FBTC Vault Token",
      symbol: "ctBeraFBTC",
      decimals: 18,
      chainId: 80094,
    },
    incentiveToken: {
      address: "0xbAC93A69c62a1518136FF840B788Ba715cbDfE2B",
      name: "Fire Bitcoin (FBTC)",
      symbol: "FBTC",
      decimals: 18,
      chainId: 80094,
    },
    funded: false,
  },
  {
    vaultAddress: "0x81235952ad93987F74e074994Def2a7e1D6F1Fb0",
    stakingToken: {
      address: "0x41abc5119830bedf86a3c587f50db41400ffee96",
      name: "Concrete Berachain HONEY Vault Token",
      symbol: "ctBeraHONEY",
      decimals: 18,
      chainId: 80094,
    },
    incentiveToken: {
      address: "0xFCBD14DC51f0A4d49d5E53C2E0950e0bC26d0Dce",
      name: "Honey (HONEY)",
      symbol: "HONEY",
      decimals: 18,
      chainId: 80094,
    },
    funded: false,
  },
  {
    vaultAddress: "0xB6E3C1154e07f8a3dc04a9a28648C7AA30511120",
    stakingToken: {
      address: "0x894d3d9d4542a307a3c76c82695bf5581fcc1383",
      name: "Concrete Berachain LBTC Vault Token",
      symbol: "ctBeraLBTC",
      decimals: 18,
      chainId: 80094,
    },
    incentiveToken: {
      address: "0xecAc9C5F704e954931349Da37F60E39f515c11c1",
      name: "Lombard Staked BTC (LBTC)",
      symbol: "LBTC",
      decimals: 18,
      chainId: 80094,
    },
    funded: false,
  },
  {
    vaultAddress: "0xc3cac88fd629652BBe0C3454D5d3049368A73849",
    stakingToken: {
      address: "0xd5e8006cb675d6556915e92c6253e5a9b9df5431",
      name: "Concrete Berachain USDC.e Vault Token",
      symbol: "ctBeraUSDC.e",
      decimals: 18,
      chainId: 80094,
    },
    incentiveToken: {
      address: "0x549943e04f40284185054145c6E4e9568C1D3241",
      name: "Bridged USDC (Stargate) (USDC.e)",
      symbol: "USDC.e",
      decimals: 18,
      chainId: 80094,
    },
    funded: false,
  },
  {
    vaultAddress: "0xe96E0D5DdA2e24050F43AF92EbB3293f6e605C9a",
    stakingToken: {
      address: "0x52fe4126d6991d1095369dfe1a8ca17fd1aa401b",
      name: "Concrete Berachain USDT0 Vault Token",
      symbol: "ctBeraUSDT0",
      decimals: 18,
      chainId: 80094,
    },
    incentiveToken: {
      address: "0x779Ded0c9e1022225f8E0630b35a9b54bE713736",
      name: "USD\u20ae0 (USD\u20ae0)",
      symbol: "USDT0",
      decimals: 18,
      chainId: 80094,
    },
    funded: false,
  },
  {
    vaultAddress: "0x585934AfBf1FA9f563b80283F8B916Dd8F66a9b6",
    stakingToken: {
      address: "0x9a4CCbbA792ea0f64D62f15416517fcd9ce30283",
      name: "Concrete Berachain USDe Vault Token",
      symbol: "ctBeraUSDe",
      decimals: 18,
      chainId: 80094,
    },
    incentiveToken: {
      address: "0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34",
      name: "USDe (USDe)",
      symbol: "USDe",
      decimals: 18,
      chainId: 80094,
    },
    funded: false,
  },
  {
    vaultAddress: "0xEC577E989c02b294D5b8f4324224a5B63F5beef7",
    stakingToken: {
      address: "0xea31ae7f4b4205badba164b1469e8f71de9ea867",
      name: "Concrete Berachain BERA Vault Token",
      symbol: "ctBeraWBERA",
      decimals: 18,
      chainId: 80094,
    },
    incentiveToken: {
      address: "0x6969696969696969696969696969696969696969",
      name: "Wrapped Bera (WBERA)",
      symbol: "WBERA",
      decimals: 18,
      chainId: 80094,
    },
    funded: false,
  },
  {
    vaultAddress: "0x335e7b56054F830883D1509AFDce58DedceFb29C",
    stakingToken: {
      address: "0x4132997563d7621644a13a2dfeb925df527455d6",
      name: "Concrete Berachain WBTC Vault Token",
      symbol: "ctBeraWBTC",
      decimals: 18,
      chainId: 80094,
    },
    incentiveToken: {
      address: "0x0555E30da8f98308EdB960aa94C0Db47230d2B9c",
      name: "Wrapped BTC (WBTC)",
      symbol: "WBTC",
      decimals: 18,
      chainId: 80094,
    },
    funded: false,
  },
  {
    vaultAddress: "0xd08E3652e6b29EBdD58fe93B422513862FB49899",
    stakingToken: {
      address: "0xffb155ef53cb08a0722c9eeeea5cb362d77ba125",
      name: "Concrete Berachain sUSDe Vault Token",
      symbol: "ctBerasUSDe",
      decimals: 18,
      chainId: 80094,
    },
    incentiveToken: {
      address: "0x211Cc4DD073734dA055fbF44a2b4667d5E5fE5d2",
      name: "Staked USDe (sUSDe)",
      symbol: "sUSDe",
      decimals: 18,
      chainId: 80094,
    },
    funded: false,
  },
  {
    vaultAddress: "0x068D072d1ee7647B9d649a7C2046166Aa81af3D3",
    stakingToken: {
      address: "0xDd31Db00885C948F1A30Ce28678dF8Ad63B15bB6",
      name: "Concrete Berachain uniBTC Vault Token",
      symbol: "ctBerauniBTC",
      decimals: 18,
      chainId: 80094,
    },
    incentiveToken: {
      address: "0xC3827A4BC8224ee2D116637023b124CED6db6e90",
      name: "uniBTC (uniBTC)",
      symbol: "uniBTC",
      decimals: 18,
      chainId: 80094,
    },
    funded: false,
  },
  {
    vaultAddress: "0x8d3e53f5521927E5c78D42B4f9e08ae8DF91B772",
    stakingToken: {
      address: "0x238cb854d644cb9b7a08e65eb803bffc05cfb834",
      name: "Concrete Berachain WETH Vault Token",
      symbol: "ctBeraWETH",
      decimals: 18,
      chainId: 80094,
    },
    incentiveToken: {
      address: "0x2f6f07cdcf3588944bf4c42ac74ff24bf56e7590",
      name: "WETH (WETH)",
      symbol: "WETH",
      decimals: 18,
      chainId: 80094,
    },
    funded: false,
  },
];

export class ConcreteVaultAdapter extends BasePriceAdapter {
  readonly name = "ConcreteVaultAdapter";

  async getTokens(): Promise<Token[]> {
    // Merge staking + incentive tokens, deduplicated by address
    const seen = new Set<string>();
    const tokens: Token[] = [];
    for (const vault of concreteVaults) {
      for (const t of [vault.stakingToken, vault.incentiveToken]) {
        const key = t.address.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          tokens.push(t);
        }
      }
    }
    return tokens;
  }

  async getTokenPrices(
    tokens: Token[],
    opts?: PriceQueryOptions,
  ): Promise<TokenPriceResult[]> {
    const results = await Promise.allSettled(
      tokens.map(async (token) => {
        // Check if this is a staking token with on-chain pricing
        const vault = concreteVaults.find(
          (v) =>
            v.stakingToken.address.toLowerCase() ===
            token.address.toLowerCase(),
        );

        if (vault) {
          return this.priceStakingToken(token, vault, opts);
        }

        // Otherwise it's an incentive token — delegate to external price source
        const prices = await this.fetchTokenPrice(
          [token.address],
          opts,
        );
        const price = prices.find(
          (p) => p.address.toLowerCase() === token.address.toLowerCase(),
        );
        if (price === undefined) {
          throw new Error(`Price not found for incentive token ${token.address}`);
        }
        return this.fulfilled(token.address, price.price);
      }),
    );

    return results.map((r, i) =>
      r.status === "fulfilled"
        ? r.value
        : this.rejected(tokens[i].address, r.reason),
    );
  }

  private async priceStakingToken(
    token: Token,
    vault: ConcreteVault,
    opts?: PriceQueryOptions,
  ) {
    const blockNumber = opts?.blockNumber;

    const [totalSupply, totalAssets] = await this.publicClient.multicall({
      allowFailure: false,
      contracts: [
        {
          address: vault.vaultAddress,
          abi: totalSupplyAbi,
          functionName: "totalSupply",
        },
        {
          address: vault.vaultAddress,
          abi: totalAssetsAbi,
          functionName: "totalAssets",
        },
      ],
      ...(blockNumber ? { blockNumber } : {}),
    });

    if (!vault.funded && totalSupply === 0n) {
      return this.fulfilled(token.address, 0);
    }

    if (totalSupply === 0n) {
      throw new Error(
        `totalSupply is 0 for ${token.symbol} on vault ${vault.vaultAddress}`,
      );
    }

    const sharePrice = Number((totalAssets * BigInt(1e18)) / totalSupply) / 1e18;

    // Get underlying asset price
    const underlyingPrices = await this.fetchTokenPrice(
      [vault.incentiveToken.address],
      opts,
    );
    const underlyingPrice = underlyingPrices[0]?.price ?? 1;

    return this.fulfilled(token.address, sharePrice * underlyingPrice);
  }
}
