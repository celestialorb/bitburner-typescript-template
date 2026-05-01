// This controller allows us to control how we skim money from hacked machines.

import { NS } from "@ns";
import { getHackedNodes } from "../lib/util";

export async function main(ns: NS): Promise<void> {
    ns.disableLog("ALL");

    while(true) {
        // First, get a set of all nodes that we have hacked.
        const NODES = getHackedNodes(ns);

        // First weaken the node.
        for(const node in NODES) {
            ns.run("main.ts", {}, "weaken", node);
        }

        // Then grow it.
        for(const node in NODES) {
            ns.run("main.ts", {}, "grow", node);
        }

        // Finally, reweaken it.
        for(const node in NODES) {
            ns.run("main.ts", {}, "weaken", node);
        }
    }
}