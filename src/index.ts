import { AquaBeraBeramoAdapter } from "./vaults/aquabera/beramoWberaVaultAdapter";
import { AquaBeraHenloAdapter } from "./vaults/aquabera/henloWberaVaultAdapter";
import { WasabiVaultAdapter } from "./vaults/wasabi/wasabiVaultAdapter";
import { ConcreteVaultAdapter } from "./vaults/concrete/concreteVaultsAdapter";
import { SxVaultAdapter } from "./vaults/sx/sxVaultAdapter";
import { BullIshGaugeAdapter } from "./vaults/bullish/BullIshGaugeAdapter";
import { IVXVaultAdapter } from "./vaults/ivx/ivx-adapter";
import { SolvBTCBeraVaultAdapter } from "./vaults/solv/SolvBTCBeraVaultAdapter";
import { WberaUsdcVaultAdapter } from "./vaults/brownfi/wberaUsdcVaultAdapter";
import { WberaHoneyVaultAdapter } from "./vaults/brownfi/wberaHoneyVaultAdapter";
import { WinnieSwapAdapter } from "./vaults/winnieswap/WinnieSwapAdapter";

import { BaseAdapter } from "./types";
import { WberaLBGTVaultAdapter } from "./vaults/examples/wbera-lbgt-vault-adapter";

export const adapters = [
    AquaBeraBeramoAdapter,
    AquaBeraHenloAdapter,
    WasabiVaultAdapter,
    ConcreteVaultAdapter,
    SxVaultAdapter,
    BullIshGaugeAdapter,
    IVXVaultAdapter,
    SolvBTCBeraVaultAdapter,
    WberaUsdcVaultAdapter,
    WberaHoneyVaultAdapter,
    WinnieSwapAdapter,
    WberaLBGTVaultAdapter,
] as const satisfies (typeof BaseAdapter)[];
