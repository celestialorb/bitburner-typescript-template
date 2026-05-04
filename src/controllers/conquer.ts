// This script is designed to recursively scan for non-controlled machines, and
// if they can be controlled, to gain root access onto them.

// First scan / scan-analyze from our current machine and determine which machines
// in range are controllable and not currently under our control.
import { NS } from "@ns";
import { log } from "/lib/log";
import { traverse } from "/lib/util";
import { conquer } from "/lib/servers";

const SKIM_SCRIPT = "/deploy/skim.js";

export async function main(ns: NS): Promise<void> {
    ns.disableLog("ALL");

    while(true) {
        await traverse(ns, async(ns: NS, node: string) => {
            await conquer(ns, node);
            const memory = ns.getScriptRam(SKIM_SCRIPT, node);
            const threads = Math.max(0, Math.floor(ns.getServerMaxRam(node) / memory));
            if(threads <= 0) return;
            if(!isFinite(threads)) return;
            if(isNaN(threads)) return;
            if(!ns.getRunningScript(SKIM_SCRIPT, node)) {
                ns.exec(SKIM_SCRIPT, node, { threads: threads });
            }
        });
        await ns.sleep(1000);
    }
}