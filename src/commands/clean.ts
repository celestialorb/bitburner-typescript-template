// This command kill all currently running scripts on all nodes. 

import { NS } from "@ns";
import { colors } from "/lib/colors";
import { traverse } from "/lib/util";

export async function main(ns: NS): Promise<void> {
    ns.tprintf(`${colors.yellow}KILLING SCRIPTS ON ALL NODES...${colors.reset}`);
    await traverse(ns, async(ns: NS, host: string) => {
        // If we don't have root access to the host, skip it.
        if(!ns.hasRootAccess(host)) return;

        // Otherwise, kill all scripts on the host.
        ns.killall(host);
    });
}