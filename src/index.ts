import { AquaBeraBeramoAdapter } from "./vaults/aquabera/beramoWberaVaultAdapter";
import { AquaBeraHenloAdapter } from "./vaults/aquabera/henloWberaVaultAdapter";

import { ConcreteVaultAdapter } from "./vaults/concrete/concreteVaultsAdapter";
import { SxVaultAdapter } from "./vaults/sx/sxVaultAdapter";
import { BullIshGaugeAdapter } from "./vaults/bullish/BullIshGaugeAdapter";
import { IVXVaultAdapter } from "./vaults/ivx/ivx-adapter";
import { SolvBTCBeraVaultAdapter } from "./vaults/solv/SolvBTCBeraVaultAdapter";
import { BrownFiVaultAdapter } from "./vaults/brownfi/BrownFiVaultAdapter";
import { WinnieSwapAdapter } from "./vaults/winnieswap/WinnieSwapAdapter";

import { BaseAdapter } from "./types";

export const adapters = [
    AquaBeraBeramoAdapter,
    AquaBeraHenloAdapter,
    ConcreteVaultAdapter,
    SxVaultAdapter,
    BullIshGaugeAdapter,
    IVXVaultAdapter,
    SolvBTCBeraVaultAdapter,
    BrownFiVaultAdapter,

    WinnieSwapAdapter,
] as const satisfies (typeof BaseAdapter)[];
