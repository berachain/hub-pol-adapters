import { AquaBeraAdapter } from "./vaults/aquabera/AquaBeraAdapter";


import { ConcreteVaultAdapter } from "./vaults/concrete/concreteVaultsAdapter";
import { SxVaultAdapter } from "./vaults/sx/sxVaultAdapter";
import { BullIshGaugeAdapter } from "./vaults/bullish/BullIshGaugeAdapter";
import { IVXVaultAdapter } from "./vaults/ivx/ivx-adapter";
import { SolvBTCBeraVaultAdapter } from "./vaults/solv/SolvBTCBeraVaultAdapter";

import { WinnieSwapAdapter } from "./vaults/winnieswap/WinnieSwapAdapter";

import { BaseAdapter } from "./types";
import { BrownFiVaultAdapter } from "./vaults/brownfi/BrownFiVaultAdapter";

export const adapters = [
    AquaBeraAdapter,
    ConcreteVaultAdapter,
    SxVaultAdapter,
    BullIshGaugeAdapter,
    IVXVaultAdapter,
    SolvBTCBeraVaultAdapter,
    BrownFiVaultAdapter,
    WinnieSwapAdapter,
] as const satisfies (typeof BaseAdapter)[];
