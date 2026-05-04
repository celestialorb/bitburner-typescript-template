// This controller will automatically manage our resource pool.
// It will automatically purchase new servers to use, adding to our power.
import { NS } from "@ns";
import { log } from "/lib/log";
import { deploy } from "/lib/servers";

const MINIMUM_FUNDS_RESERVE = 500e3;
const MINIMUM_RAM_POWER = 1;

export async function main(ns: NS): Promise<void> {
    ns.disableLog("ALL");

    // Call our main botnet controller.
    await botnet(ns);
}

export async function botnet(ns: NS): Promise<void> {
    while(true) {
        // Determine how many servers we currently have.
        const servers = ns.cloud.getServerNames();
        const server_limit = Math.min(Math.floor(ns.getPlayer().skills.hacking / 100), ns.cloud.getServerLimit());
        log.info(ns, `server count: ${servers.length} / ${server_limit}`);

        // Calculate how many funds we have.
        let funds = Math.max(ns.getPlayer().money - MINIMUM_FUNDS_RESERVE, 0);
        log.info(ns, `available funds: $${ns.format.number(funds, 0)}`);

        // If we can purchase a new server, go for it.
        const new_cost = ns.cloud.getServerCost(2 ** MINIMUM_RAM_POWER);
        log.info(ns, `cost of a new server: $${ns.format.number(new_cost, 0)}`);
        if(funds >= 2 * new_cost && servers.length < server_limit) {
            log.info(ns, `purchasing new server!`);
            const new_machine = ns.cloud.purchaseServer("botnet", 2 ** MINIMUM_RAM_POWER);

            // Deploy our control package to the newly purchased server.
            await deploy(ns, new_machine);

            // Recalculate funds.
            funds = Math.max(ns.getPlayer().money - MINIMUM_FUNDS_RESERVE, 0);
        }

        // Next, look at upgrading our servers.
        for(const server of servers) {
            log.info(ns, `examining upgrade of server`, { host: server });
            let server_info = ns.getServer(server);
            let upgrade_ram = 2 * server_info.maxRam;
            let upgrade_cost = ns.cloud.getServerCost(2 * server_info.maxRam);
            log.info(ns, `upgrade cost for server: $${ns.format.number(upgrade_cost, 0)}`, { host: server });
            if(funds >= 2 * upgrade_cost) {
                log.info(ns, `upgrading server`, { host: server });
                ns.cloud.upgradeServer(server_info.hostname, upgrade_ram);

                // Recalculate funds.
                funds = Math.max(ns.getPlayer().money - MINIMUM_FUNDS_RESERVE, 0);
            }
        }

        // Sleep for some time to avoid hammering the hardware.
        await ns.sleep(10000);
    }
}