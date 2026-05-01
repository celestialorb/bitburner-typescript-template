// This script is designed to recursively scan for non-controlled machines, and
// if they can be controlled, to gain root access onto them.

// First scan / scan-analyze from our current machine and determine which machines
// in range are controllable and not currently under our control.
import { NS } from "@ns";
import { log } from "/lib/log";
import { traverse } from "/lib/util";

export async function main(ns: NS): Promise<void> {
    ns.disableLog("ALL");

    while(true) {
        await traverse(ns, conquer);
        ns.run("/main.js", {}, "deploy");
        await ns.sleep(10000);
    }
}

async function conquer(ns: NS, host: string = "home"): Promise<void> {
    // Try and conquer the host.
    if(!ns.hasRootAccess(host)) {
        // ns.printf(`attempting to conquer ${colors.red}%s${colors.reset}...`, host);
        log.debug(ns, `attempting to conquer`)

        // Try to gain root access to the host using all available methods.
        if(ns.fileExists("BruteSSH.exe", "home")) ns.brutessh(host);
        if(ns.fileExists("FTPCrack.exe", "home")) ns.ftpcrack(host);
        if(ns.fileExists("HTTPWorm.exe", "home")) ns.httpworm(host);
        if(ns.fileExists("SQLInject.exe", "home")) ns.sqlinject(host);

        try {
            ns.nuke(host);
            ns.printf(ns.sprintf(`successfully conquered ${colors.green}%s${colors.reset}!`, host));
            ns.toast(`successfully conquered ${host}`, "success", 10000);
        } catch (e) {
            ns.printf(`failed to conquer ${colors.red}%s${colors.reset}`, host);
        }
    }
}