/**
 * This controller manages contracts on the network.
 */

import { NS } from "@ns";
import { log } from "/lib/log";
import { getAllContracts, solve } from "/lib/contracts";

let FAILED_CONTRACTS = new Set<string>();

export async function main(ns: NS): Promise<void> {
    ns.disableLog("ALL");

    const contracts = await getAllContracts(ns);
    for(const [filename, hostname] of contracts.entries()) {
        // Check to ensure we haven't failed this one already, if we have just skip it.
        if(filename in FAILED_CONTRACTS) {
            log.debug(ns, `contract previous failed, skipping...`, { contract: {filename: filename, hostname: hostname } });
            continue;
        }

        log.info(ns, `attempting to solve}`, { contract: {filename: filename, hostname: hostname } });
        const success = solve(ns, filename, hostname);

        // If we weren't successful, log it and continue onto the next one.
        if(!success) {
            log.error(ns, `failed to solve contract: ${filename}@${hostname}`);
            FAILED_CONTRACTS.add(filename);
            continue;
        }
        log.info(ns, `successfully solved ${filename}@${hostname}!`);
    }

    // ns.tprintf(`contract types:`);
    // let types = ns.codingcontract.getContractTypes();
    // for(const type of types) {
    //     ns.tprintf(type);
    // }

    // for(const [filename, host] of contracts.entries()) {
    //     let contract = ns.codingcontract.getContract(filename, host);
    //     ns.tprintf("==============================================");
    //     ns.tprintf(contract.type);
    //     ns.tprintf(contract.description);
    //     // ns.tprintf(ns.codingcontract.getData(contract, host));
    // }
    // return;
}
