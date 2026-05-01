// This command will use whatever compute power we have to
// weaken a specific target.

import { NS } from "@ns";
import { colors, isWeakened, traverse } from "/lib/util";

export async function main(ns: NS): Promise<void> {
    ns.disableLog("ALL");
    if(ns.args.length <= 0) {
        ns.printf("ERROR: no target given to weaken");
        ns.exit();
    }
    const target = ns.args[0] as string;

    // If the target is already weakened, simply return.
    if(isWeakened(ns, target)) { 
        return;
    }

    ns.printf(`weakening ${colors.cyan}%s${colors.reset}...`, target);
    ns.toast(ns.sprintf("weakening %s", target), "info", 2500);
    await traverse(ns, async(ns: NS, node: string) => {
        ns.printf("evaulating %s as weakening agent", node);

        // If there is a skimmer running on this node, skip it.
        if(ns.scriptRunning("/deploy/skim.js", node)) { return; }

        const memory = ns.getScriptRam("/deploy/weaken.js", node);
        // If the script doesn't exist on the node, skip it.
        if(memory <= 0) { return; }

        // If the server doesn't have any memory, skip it.
        if(!ns.getServerMaxRam(node)) { return; }

        // Calculate the number of threads we can run.
        const threads = Math.floor(ns.getServerMaxRam(node) / memory);

        // If we can't run a single thread, skip this host.
        if(threads <= 0) { return; }

        // Otherwise, run our weaken script.
        ns.killall(node);
        ns.exec("/deploy/weaken.js", node, { threads: threads }, target);
    });
}