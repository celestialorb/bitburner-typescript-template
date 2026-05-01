// This script focuses on performing HGW actions against a target.
import { NS } from "@ns";
import { grow, hack, weaken } from "/lib/hgw";
import { log } from "/lib/log";

export async function main(ns: NS): Promise<void> {
    ns.disableLog("ALL");

    if(ns.args.length <= 3) {
        log.error(ns, "not enough arguments given!");
        ns.exit();
    }

    const target = ns.args[0] as string;
    const weaken_threads = ns.args[1] as number;
    const growth_threads = ns.args[2] as number;
    const hack_threads = ns.args[3] as number;

    let weaken_promise = weaken(ns, target, weaken_threads);
    let growth_promise = grow(ns, target, growth_threads);
    let hack_promise = hack(ns, target, hack_threads);

    await Promise.all([weaken_promise, growth_promise, hack_promise]);
}