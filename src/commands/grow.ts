// This command will use whatever compute power we have to
// grow a specific target.

import { NS } from "@ns";
import { colors, isGrown, traverse } from "../lib/util";

export async function main(ns: NS): Promise<void> {
    if(ns.args.length <= 0) {
        ns.printf("ERROR: no target given to grow");
        ns.exit();
    }
    const target = ns.args[0] as string;

    // If the target is already grown, simply return.
    if(isGrown(ns, target)) {
        return;
    }

    ns.printf(`growing ${colors.cyan}%s${colors.reset}...`, target);
    ns.toast(ns.sprintf("growing %s", target), "info", 2500);
    await traverse(ns, async(ns: NS, node: string) => {
        ns.printf("evaulating %s as growth agent", node);

        // If there is a skimmer running on this node, skip it.
        if(ns.scriptRunning("/deploy/skim.js", node)) { return; }

        const memory = ns.getScriptRam("/deploy/grow.js", node);
        // If the script doesn't exist on the node, skip it.
        if(memory <= 0) { return; }

        // If the server doesn't have any memory, skip it.
        if(!ns.getServerMaxRam(node)) { return; }

        // Calculate the number of threads we can run.
        const threads = Math.floor(ns.getServerMaxRam(node) / memory);

        // If we can't run a single thread, skip this host.
        if(threads <= 0) { return; }

        // Otherwise, run our grow script.
        ns.killall(node);
        ns.exec("/deploy/grow.js", node, { threads: threads }, target);
    });
}