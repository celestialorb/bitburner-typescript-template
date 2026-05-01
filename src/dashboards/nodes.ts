// This script provides the user with a nice terminal dashboard
// for monitoring the stats of all known nodes.
import { NS } from "@ns";

const WEAKEN_SECURITY_DELTA = 0.05;

// The script will only perform one action per iteration, and will wait for the action to complete before analyzing again.
export async function main(ns: NS) {
    while(true) {
        const [width, height] = ns.ui.windowSize();
        ns.ui.clearTerminal();
        ns.tprintf("=".repeat(width/4));
        await ns.sleep(1000);
    }
}
