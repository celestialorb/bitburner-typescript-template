// This script is for quickly obtaining money.
// It is intended to be used when you need a set amount of cash.
import { NS } from "@ns";
import { colors, traverse } from "/lib/util";

export async function main(ns: NS): Promise<void> {
    ns.disableLog("ALL");

    const targetMoney = ns.args.length > 0 ? ns.args[0] as number : 1e9;

    while(ns.getPlayer().money < targetMoney) {
        await traverse(ns, async (ns: NS, host: string) => {
            // If we don't have root access to the host, skip it.
            if(!ns.hasRootAccess(host)) return;

            // If the host has no money, skip it.
            if(ns.getServerMoneyAvailable(host) <= 0) return;

            // If we don't have enough hacking skill to hack the host, skip it.
            if(ns.getPlayer().skills.hacking < ns.getServerRequiredHackingLevel(host)) return;

            // Otherwise, hack the host.
            ns.printf(`hacking ${colors.green}%s${colors.reset}...`, host);
            let earnedMoney = await ns.hack(host);
            ns.printf(`hacked %s for ${colors.green}$%s${colors.reset}...`, host, ns.formatNumber(earnedMoney));
            ns.toast(`hacked ${host} for $${ns.formatNumber(earnedMoney)}`, "success", 2500);
        });
    }
}