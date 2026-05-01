// This command works to sequentially degrade all hacked machines,
// so that they are ready to be skimmed.

import { NS } from "@ns";
import { colors, getHackedNodes, getMaximumThreads, isGrown, isWeakened } from "/lib/util";

export async function main(ns: NS): Promise<void> {
    ns.disableLog("ALL");

    // First, get a set of all nodes that we have hacked.
    const NODES = await getHackedNodes(ns);
    for(const node of NODES) {
        ns.printf("checking node: %s", node);

        // First, determine if we should go ahead and put a skimmer on it.
        let weakened = isWeakened(ns, node);
        let grown = isGrown(ns, node);
        ns.printf("INFO: %s weakend: %s", node, weakened);
        ns.printf("INFO: %s grown: %s", node, grown);
        if(weakened && grown) {
            ns.killall(node);
            let threads = getMaximumThreads(ns, node, "/deploy/skim.js");
            if(threads <= 0) {
                ns.printf("ERROR: could not run skimmer for: %s", node);
                continue;
            }
            ns.printf("INFO: starting skimmer for %s with %d threads", node, threads);
            if(!ns.exec("/deploy/skim.js", node, { threads: threads })) {
                ns.printf("ERROR: unable to start skimmer for %s", node);
            }
            continue;
        }

        // First determine if we care about this node.
        // If it already has a skimmer on it, then skip it.
        if(ns.getRunningScript("/deploy/skim.ts", node)) {
            ns.printf("INFO: node %s already has a skimmer, skipping...", node);
            continue;
        }

        // First weaken the node.
        ns.printf(`initial weaken of ${colors.cyan}${node}${colors.reset}...`);
        ns.run("main.js", {}, "weaken", node);

        // Wait until the node is fully weakened.
        while(!isWeakened(ns, node)) { await ns.sleep(1000); }

        // Then kill any remaining weaken scripts.
        // for(const n of NODES) {
        //     if(!ns.scriptKill("deploy/weaken.js", n)) {
        //         ns.printf("INFO: did not kill any process on: %s", n);
        //     }
        // }

        // Then grow it.
        ns.printf(`growing ${colors.cyan}${node}${colors.reset}...`);
        ns.run("main.js", {}, "grow", node);

        // Wait until the node is fully grown.
        while(!isGrown(ns, node)) { await ns.sleep(1000); }

        // Then kill any remaining growth scripts.
        // for(const n of NODES) {
        //     if(!ns.scriptKill("deploy/grow.js", n)) {
        //         ns.printf("INFO: did not kill any process on: %s", n);
        //     }
        // }

        // Finally, reweaken it.
        ns.printf(`final weaken of ${colors.cyan}${node}${colors.reset}...`);
        ns.run("main.js", {}, "weaken", node);

        // Wait until the node is fully weakened.
        while(!isWeakened(ns, node)) { await ns.sleep(1000); }
        ns.printf(`${colors.green}fully degraded${colors.reset} ${colors.cyan}${node}${colors.reset}!`);

        // Then kill any remaining weaken scripts.
        // for(const n of NODES) {
        //     if(!ns.scriptKill("deploy/weaken.js", n)) {
        //         ns.printf("INFO: did not kill any process on: %s", n);
        //     }
        // }

        // Then start a skimmer on the node.
        ns.killall(node);
        let threads = getMaximumThreads(ns, node, "/deploy/skim.js");
        if(threads <= 0) {
            ns.printf("ERROR: could not run skimmer for: %s", node);
            continue;
        }
        ns.printf("INFO: starting skimmer for %s with %d threads", node, threads);
        if(!ns.exec("/deploy/skim.js", node, { threads: threads })) {
            ns.printf("ERROR: unable to start skimmer for %s", node);
        }
    }
}