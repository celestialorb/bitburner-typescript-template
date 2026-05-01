// This script receives a given target stored on a port,
// then works to first weaken, then grow the target to get
// it into a hackable position.

import { NS } from "@ns";
import { colors, constants } from "../lib/util";

export async function main(ns: NS): Promise<void> {
    ns.disableLog("ALL");

    const THREADS = ns.getRunningScript()?.threads || 1;

    let port = ns.getPortHandle(constants.VICTIM_PORT);
    port.clear();

    while(true) {
        // Attempt to read what our next target is.
        let target = "NULL PORT DATA";
        while(target === "NULL PORT DATA") {
            await ns.sleep(1000);
            target = port.peek();
        }

        // Once here, we have been given a target.
        const securityLevel = ns.getServerSecurityLevel(target);
        const minSecurityLevel = ns.getServerMinSecurityLevel(target);
        const moneyAvailable = ns.getServerMoneyAvailable(target);
        const maxMoney = ns.getServerMaxMoney(target);
    
        // Determine if we need to perform a weaken action.
        while(securityLevel > (minSecurityLevel + THREADS * constants.WEAKEN_SECURITY_DELTA)) {
            ns.printf(`weakening ${colors.red}%s${colors.reset} due to high security level (%.2f > %.2f)...`, target, securityLevel, minSecurityLevel + THREADS * constants.WEAKEN_SECURITY_DELTA);
            await ns.weaken(target);
        }
    
        // Otherwise grow the server.
        while(moneyAvailable < maxMoney) {
            ns.printf(`growing ${colors.red}%s${colors.reset} due to insufficient money (%.2f%% of max money)...`, target, (moneyAvailable / maxMoney) * 100);
            await ns.grow(target);
        }
    }
}