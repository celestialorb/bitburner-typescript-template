// This controller simply shares as much of our usable servers as possible.

import { NS } from "@ns";
import { log } from "/lib/log";
import { getAllUsableServers, getAvailableRam } from "/lib/servers";

export async function main(ns: NS): Promise<void> {
    ns.disableLog("ALL");

    while(true) {
        let servers = await getAllUsableServers(ns, true);
        for(const server of servers) {
            // Determine the number of threads for the server.
            let memory = ns.getScriptRam("/deploy/share.js", server.hostname);
            let available = getAvailableRam(ns, server);
            let threads = Math.max(0, Math.floor(available / memory));
            if(threads <= 0) continue;

            log.debug(ns, `sharing ${server.hostname} with factions`);
            ns.exec("/deploy/share.js", server.hostname, { threads: threads });
        }

        await ns.sleep(1000);
    }

    return Promise.resolve();
}