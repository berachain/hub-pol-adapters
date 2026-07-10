import { SxVaultAdapter } from "./vaults/sx/sxVaultAdapter";
import { BullIshGaugeAdapter } from "./vaults/bullish/BullIshGaugeAdapter";
import { IVXVaultAdapter } from "./vaults/ivx/ivx-adapter";
import { SolvBTCBeraVaultAdapter } from "./vaults/solv/SolvBTCBeraVaultAdapter";

import { BaseAdapter } from "./types";

export const adapters = [
    SxVaultAdapter,
    BullIshGaugeAdapter,
    IVXVaultAdapter,
    SolvBTCBeraVaultAdapter,
] as const satisfies (typeof BaseAdapter)[];
