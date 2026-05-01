// This script simply performs a grow operation with the maximum number of threads.
import { NS } from "@ns";
import { grow } from "/lib/hgw";
import { log } from "/lib/log";

export async function main(ns: NS): Promise<void> {
    ns.disableLog("ALL");

    if(ns.args.length <= 0) {
        log.error(ns, "failed to supply a target");
        ns.exit();
    }

    let host = ns.args[0] as string;
    await grow(ns, host);
}