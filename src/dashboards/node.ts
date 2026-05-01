// This dashboard displays constantly updating information for a single node.
import { NS } from "@ns";
import { colors } from "../lib/util";

// The script will only perform one action per iteration, and will wait for the action to complete before analyzing again.
export async function main(ns: NS) {
    ns.disableLog("ALL");

    let node = "home";
    if(ns.args.length > 0) {
        node = ns.args[0] as string;
    }

    while(true) {
        const [width, height] = ns.ui.windowSize();
        ns.ui.clearTerminal();
        ns.tprintf("Dashboard Process: %s", ns.getRunningScript()?.pid);
        ns.tprintf(`Node: ${colors.cyan}${node}${colors.reset}`);
        ns.tprintf(`Security Level: ${ns.getServerSecurityLevel(node)}`)
        ns.tprintf(`Minimum Security Level: ${ns.getServerMinSecurityLevel(node)}`);

        let moneyPercent = 100 * ns.getServerMoneyAvailable(node) / ns.getServerMaxMoney(node);
        ns.tprintf(`Money: ${ns.getServerMoneyAvailable(node)} (${ns.formatNumber(moneyPercent)}%%)`);
        await ns.sleep(1000);
    }
}
