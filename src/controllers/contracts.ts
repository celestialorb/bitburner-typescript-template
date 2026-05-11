/**
 * This controller manages contracts on the network.
 */

import { NS } from "@ns";
import { log } from "/lib/log";
import { getAllContracts, generate, solve, test } from "/lib/contracts";

let FAILED_CONTRACTS = new Set<string>();

export async function main(ns: NS): Promise<void> {
    // Disable all built-in Netscript logs.
    ns.disableLog("ALL");

    // Define our controller's flags.
    const flags = ns.flags([
        ["continuous", false],
        ["delay", 10000],
        ["dry-run", false],
        ["generate", false],
        ["list", false],
        ["test", false],
    ]);
    const continuous = flags["continuous"] as boolean;
    const delay = flags["delay"] as number;
    const dry_run = flags["dry-run"] as boolean;
    const generateContracts = flags["generate"] as boolean;
    const list = flags["list"] as boolean;
    const testContracts = flags["test"] as boolean;

    // If we're set to generate contracts, simply do that then return.
    if(generateContracts) {
        generate(ns);
        return;
    }

    // If we're set to test our contract solutions, simply do that and return.
    if(testContracts) {
        test(ns);
        return;
    }

    // Find all contracts.
    const contracts = await getAllContracts(ns);

    // If we've been instructed to simply list contracts that we find, do that and only that.
    if(list) {
        for(const [filename, host] of contracts.entries()) {
            let contract = ns.codingcontract.getContract(filename, host);
            ns.tprintf("==============================================");
            ns.tprintf(contract.type);
            ns.tprintf(contract.description);
            ns.tprintf(contract.data.toString());
        }
        return;
    }

    while(true) {
        await solveAllContracts(ns, contracts, dry_run);

        // If we're not running continuously, then break out of the loop.
        if(!continuous) break;

        // Otherwise, sleep for a given delay to avoid hammering the system.
        await ns.sleep(delay);
    }
}

/**
 * Attempt to solve all found contracts.
 * @param ns The netscript object.
 * @param contracts The contracts map with filename as the key and the name of the host machine as the value.
 * @param dry_run Whether or not perform a dry run.
 */
async function solveAllContracts(ns: NS, contracts: Map<string, string>, dry_run: boolean): Promise<void> {
    for(const [filename, hostname] of contracts.entries()) {
        // Check to ensure we haven't failed this one already, if we have just skip it.
        if(filename in FAILED_CONTRACTS) {
            log.debug(ns, `contract previous failed, skipping...`, { contract: {filename: filename, hostname: hostname } });
            continue;
        }

        log.info(ns, `attempting to solve`, { contract: {filename: filename, hostname: hostname } });
        const success = solve(ns, filename, hostname, dry_run);

        // If we weren't successful, log it and continue onto the next one.
        if(!success) {
            log.error(ns, `failed to solve contract: ${filename}@${hostname}`);

            // If we're not in a dry run then mark the contract as having been failed so we don't
            // accidentally destroy it.
            if(!dry_run) {
                FAILED_CONTRACTS.add(filename);
            }
            continue;

        }
        log.info(ns, `successfully solved ${filename}@${hostname}!`);
    }
}
