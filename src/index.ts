import { SNECTVaultAdapter } from "./vaults/beraborrow/sNECTVaultAdapter";
import { AquaBeraBeramoAdapter } from "./vaults/aquabera/beramoWberaVaultAdapter";
import { AquaBeraHenloAdapter } from "./vaults/aquabera/henloWberaVaultAdapter";
import { WasabiVaultAdapter } from "./vaults/wasabi/wasabiVaultAdapter";
import { DRUSDVaultAdapter } from "./vaults/dolomite/drusdVaultAdapter";
import { ConcreteVaultAdapter } from "./vaults/concrete/concreteVaultsAdapter";
import { SxVaultAdapter } from "./vaults/sx/sxVaultAdapter";
import { WeiberaVaultAdapter } from "./vaults/webera/weiberaVaultAdapter";
import { WewberaVaultAdapter } from "./vaults/webera/wewberaVaultAdapter";
import { BullIshGaugeAdapter } from "./vaults/bullish/BullIshGaugeAdapter";
import { IVXVaultAdapter } from "./vaults/ivx/ivx-adapter";
import { SolvBTCBeraVaultAdapter } from "./vaults/solv/SolvBTCBeraVaultAdapter";
import { BendVaultAdapter } from "./vaults/bend";
import { WberaUsdcVaultAdapter } from "./vaults/brownfi/wberaUsdcVaultAdapter";
import { WberaHoneyVaultAdapter } from "./vaults/brownfi/wberaHoneyVaultAdapter";
import { WinnieSwapAdapter } from "./vaults/winnieswap/WinnieSwapAdapter";
import { TermMaxVaultAdapter } from "./vaults/termmax";
import { BaseAdapter } from "./types";
import { WberaLBGTVaultAdapter } from "./vaults/examples/wbera-lbgt-vault-adapter";

export const adapters = [
    SNECTVaultAdapter,
    AquaBeraBeramoAdapter,
    AquaBeraHenloAdapter,
    WasabiVaultAdapter,
    DRUSDVaultAdapter,
    ConcreteVaultAdapter,
    BendVaultAdapter,
    SxVaultAdapter,
    WeiberaVaultAdapter,
    WewberaVaultAdapter,
    BullIshGaugeAdapter,
    IVXVaultAdapter,
    SolvBTCBeraVaultAdapter,
    WberaUsdcVaultAdapter,
    WberaHoneyVaultAdapter,
    WinnieSwapAdapter,
    WberaLBGTVaultAdapter,
    TermMaxVaultAdapter,
] as const satisfies (typeof BaseAdapter)[];
