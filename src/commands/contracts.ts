// This command finds and reports all contracts on the network.

import { NS } from "@ns";
import { log } from "/lib/log";
import { traverse } from "/lib/util";

export async function main(ns: NS): Promise<void> {
    ns.tprintf(`[INFO] finding contracts on the network...`);
    let count = 0;
    await traverse(ns, async(ns: NS, host: string) => {
        let files = ns.ls(host);
        for(const file of files) {
            if(!file.endsWith(".cct")) continue;
            count += 1;
            ns.tprintf(`[INFO] ${host} -- found: ${file}`);

            ns.tprintf(ns.codingcontract.getContract(file, host).type);
            ns.tprintf(ns.codingcontract.getDescription(file, host));
            ns.tprintf("================================");
        }

        const next = ns.prompt("continue?", { type: "boolean" });
    });
    ns.tprintf(`[INFO] found ${count} contracts!`);
}