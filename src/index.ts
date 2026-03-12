export {
  BasePriceAdapter,
  type Token,
  type TokenPriceFulfilled,
  type TokenPriceRejected,
  type TokenPriceResult,
  type TokenAndPrice,
  type PriceQueryOptions,
  type GetTokenPrices,
  type PriceAdapterConfig,
} from "./types";

export { AquaBeraAdapter } from "./adapters/aquabera/adapter";
export { BrownFiVaultAdapter } from "./adapters/brownfi/adapter";
export { BullIshGaugeAdapter } from "./adapters/bullish/adapter";
export { ConcreteVaultAdapter } from "./adapters/concrete/adapter";
export { IVXVaultAdapter } from "./adapters/ivx/adapter";
export { SolvBTCBeraVaultAdapter } from "./adapters/solv/adapter";
export { SxVaultAdapter } from "./adapters/sx/adapter";
export { WinnieSwapAdapter } from "./adapters/winnieswap/adapter";

import { AquaBeraAdapter } from "./adapters/aquabera/adapter";
import { BrownFiVaultAdapter } from "./adapters/brownfi/adapter";
import { BullIshGaugeAdapter } from "./adapters/bullish/adapter";
import { ConcreteVaultAdapter } from "./adapters/concrete/adapter";
import { IVXVaultAdapter } from "./adapters/ivx/adapter";
import { SolvBTCBeraVaultAdapter } from "./adapters/solv/adapter";
import { SxVaultAdapter } from "./adapters/sx/adapter";
import { WinnieSwapAdapter } from "./adapters/winnieswap/adapter";
import { BasePriceAdapter } from "./types";

export const adapters = [
  AquaBeraAdapter,
  ConcreteVaultAdapter,
  SxVaultAdapter,
  BullIshGaugeAdapter,
  IVXVaultAdapter,
  SolvBTCBeraVaultAdapter,
  BrownFiVaultAdapter,
  WinnieSwapAdapter,
] as const satisfies (typeof BasePriceAdapter)[];
