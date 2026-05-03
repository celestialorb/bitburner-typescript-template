// This controller utilizes all available resources to continually
// weaken, grow, and hack all available servers.

import { NS, Server } from "@ns";
import { constants } from "/lib/constants";
import { log } from "/lib/log";
import { getAllHackableServers, getAllPrimedServers, getAllUsableServers, getAvailableRam, isHackReady } from "/lib/servers";

export async function main(ns: NS): Promise<void> {
    // Disable all built-in Netscript logging.
    ns.disableLog("ALL");

    // Define our flags.
    const flags = ns.flags([
        ["continuous", false],
        ["delay", 10000],
        ["dry-run", false],
        ["enable-weakens", true],
        ["enable-growths", true],
        ["enable-hacks", true],
        ["include-home", false],
    ]);

    // Call our main controller entrypoint.
    await hgw(
        ns,
        flags["continuous"] as boolean,
        flags["delay"] as number,
        flags["dry-run"] as boolean,
        flags["enable-weakens"] as boolean,
        flags["enable-growths"] as boolean,
        flags["enable-hacks"] as boolean,
        flags["include-home"] as boolean,
    );
}

async function hgw(
    ns: NS,
    continous: boolean = true,
    delay: number = 1000,
    dry_run: boolean = false,
    enable_weakens: boolean = true,
    enable_growths: boolean = true,
    enable_hacks: boolean = true,
    include_home: boolean = false,
): Promise<void> {
    log.info(ns, `starting main HGW controller loop`);

    // Main controller loop.
    while(true) {
        // Let's start by getting the set of all known, hackable servers.
        let targets = await getAllHackableServers(ns);
        log.info(ns, `determined ${targets.size} targets`);

        // Then obtain the set of all usable servers and determine the number of threads available in our pool.
        let servers = await getAllUsableServers(ns, include_home);
        log.info(ns, `determined ${servers.size} servers`);

        // Start by getting just primed servers and hacking them.
        let primed = await getAllPrimedServers(ns);
        if(enable_hacks) hack(ns, new Set<Server>(primed), servers, dry_run);

        for(const target of targets) {
            let single_target = new Set<Server>();
            single_target.add(target);

            // First, we start hacking any targets that can be hacked.
            // if(enable_hacks) hack(ns, single_target, servers, dry_run);

            // Then start weakening any targets that can be weakened.
            if(enable_weakens) weaken(ns, single_target, servers, dry_run);

            // Finally, we look at growing any targets that can be grown.
            if(enable_growths) grow(ns, single_target, servers, dry_run);
        }

        // If we're not set to run continously, then break the loop here.
        if(!continous) break;

        // Sleep to prevent hammering.
        await ns.sleep(delay);
    }
}

async function weaken(ns: NS, targets: Set<Server>, servers: Set<Server>, dry_run: boolean = false): Promise<void> {
    // Iterate over each hackable target and start weakening them.
    for(const target of targets) {
        if(target.hackDifficulty == null) continue;
        if(target.minDifficulty == null) continue;

        log.info(ns, `distributing weaken threads for target`, { host: target.hostname });
        log.info(ns, `security: ${ns.format.number(target.hackDifficulty, 2)} => ${ns.format.number(target.minDifficulty, 2)}`, { host: target.hostname });

        // Determine the security Δ necessary to ensure the machine ends up at near its minimum security level.
        let total_security_Δ = target.hackDifficulty - target.minDifficulty;
        log.debug(ns, `total security Δ: ${ns.format.number(total_security_Δ)}`, { host: target.hostname });

        // For each controlled server, determine the amount we can weaken the security by (per thread).
        // Then start a weaken process on that node.
        for(const server of servers) {
            log.info(ns, `determining weaken threads for target from server`, { host: server.hostname });

            // Determine the RAM cost of our weaken script.
            let ram_cost = ns.getScriptRam(constants.WEAKEN_SCRIPT, server.hostname);

            // If the weaken deployment script doesn't exist on our server, skip it for now.
            if(!ram_cost) {
                log.error(ns, `weaken deployment script not available!`, { host: server.hostname });
                continue;
            }

            let ram_available = getAvailableRam(ns, server);
            log.debug(ns, `RAM available: ${ns.format.ram(ram_available)}`, { host: server.hostname });

            // Calculate how many threads are available for us on the server for a weaken operation.
            let threads_available = Math.max(0, Math.floor(ram_available / ns.getScriptRam(constants.WEAKEN_SCRIPT, server.hostname)));
            log.debug(ns, `threads available for weaken: ${ns.format.number(threads_available, 0)}`, { host: server.hostname });

            // Determine the amount of security we need to remove from the target.
            let security_Δ_per_thread = ns.weakenAnalyze(1, server.cpuCores);
            log.debug(ns, `security Δ per thread: ${ns.format.number(security_Δ_per_thread)}`, { host: server.hostname });

            // Determine the number of weaken threads we'll need from this server.
            let weaken_threads = Math.min(Math.floor(total_security_Δ / security_Δ_per_thread), threads_available);
            log.debug(ns, `weaken threads determined: ${ns.format.number(weaken_threads, 0)}`, { host: server.hostname });

            // Calculate the total amount of security to be removed by this server.
            let security_Δ = weaken_threads * security_Δ_per_thread;
            log.debug(ns, `security to be removed: ${ns.format.number(security_Δ, 2)}`, { host: server.hostname });

            // Check to ensure we have weaken threads to use.
            if(weaken_threads <= 0) {
                log.info(ns, `no weaken threads to use, skipping server`, { host: server.hostname });
                continue;
            }

            // If there's already a script weakening our target on this server, then skip this server.
            if(ns.getRunningScript(constants.WEAKEN_SCRIPT, server.hostname, target.hostname)) continue;

            // Start our weaken process!
            if(dry_run) {
                log.warn(ns, `skipping running of weaken script due to --dry-run flag!`, { host: server.hostname });
            } else {
                log.info(ns, `starting WEAKEN script targeting ${target.hostname}`, { host: server.hostname });
                let pid = ns.exec(constants.WEAKEN_SCRIPT, server.hostname, { threads: weaken_threads }, target.hostname);
                if(!pid) {
                    log.error(ns, `unable to start weaken script`, { host: server.hostname });
                }
            }

            // Adjust our total security delta.
            total_security_Δ = Math.max(0, total_security_Δ - security_Δ);
            log.debug(ns, `total security left: ${ns.format.number(total_security_Δ, 2)}`, { host: target.hostname });

            // If we don't have any security left, break out of this loop.
            if(total_security_Δ <= 0) break;
        }
    }
}

async function grow(ns: NS, targets: Set<Server>, servers: Set<Server>, dry_run: boolean = false): Promise<void> {
    // Iterate over each hackable target and start growing them.
    for(const target of targets) {
        if(target.moneyMax == null) continue;
        if(target.moneyAvailable == null) continue;

        log.info(ns, `distributing growth threads for target`, { host: target.hostname });

        // Determine the multiplier we wish to reach.
        let growth_multiplier_target = target.moneyMax / target.moneyAvailable;
        if(!Number.isFinite(growth_multiplier_target)) { continue; }
        log.debug(ns, `growth multiplier target: ${ns.format.number(100 * growth_multiplier_target, 2, 1000000)}%%`, { host: target.hostname });

        // Estimate the number of growth threads needed.
        let estimated_growth_threads = Math.floor(ns.growthAnalyze(target.hostname, growth_multiplier_target, 1));
        log.debug(ns, `estimated growth threads: ${ns.format.number(estimated_growth_threads, 0)}`, { host: target.hostname });

        // For each controlled server, determine the amount we can grow the value by (per thread).
        // Then start a growth process on that node.
        for(const server of servers) {
            let ram_available = getAvailableRam(ns, server);
            log.debug(ns, `RAM available: ${ns.format.ram(ram_available)}`, { host: server.hostname });

            // Calculate how many threads are available for us on the server for a growth operation.
            let threads_available = Math.max(0, Math.floor(ram_available / ns.getScriptRam(constants.GROW_SCRIPT, server.hostname)));
            log.debug(ns, `threads available: ${ns.format.number(threads_available, 0)}`, { host: target.hostname });

            // Determine how many growth threads we can run on this server.
            let growth_threads = Math.min(threads_available, Math.floor(ns.growthAnalyze(target.hostname, growth_multiplier_target, server.cpuCores)));
            if(growth_threads <= 0) {
                log.info(ns, `no growth threads to use, skipping server`, { host: server.hostname });
                continue;
            }
            log.debug(ns, `growth threads determined: ${ns.format.number(growth_threads, 0)}`, { host: target.hostname });

            // If there's already a script growing our target on this server, then skip this server.
            if(ns.getRunningScript(constants.GROW_SCRIPT, server.hostname, target.hostname)) continue;

            // Start our growth process!
            if(dry_run) {
                log.warn(ns, `skipping running of growth script due to --dry-run flag!`, { host: server.hostname });
            } else {
                log.info(ns, `starting GROW script targeting ${target.hostname}`, { host: server.hostname });
                let pid = ns.exec(constants.GROW_SCRIPT, server.hostname, { threads: growth_threads }, target.hostname);
                if(!pid) {
                    log.error(ns, `unable to start grow script`, { host: server.hostname });
                }
            }

            // Adjust our estimated growth threads count.
            estimated_growth_threads = Math.max(0, estimated_growth_threads - growth_threads);
            log.debug(ns, `estimated growth thread remaining: ${ns.format.number(estimated_growth_threads, 0)}`, { host: target.hostname });

            // If we don't need to grow any more, break out of this loop.
            if(estimated_growth_threads <= 0) break;
        }
    }
}

async function hack(ns: NS, targets: Set<Server>, servers: Set<Server>, dry_run: boolean = false): Promise<void> {
    // Iterate over each hackable target and start hacking them.
    for(const target of targets) {
        log.info(ns, `distributing hack threads for target`, { host: target.hostname });

        if(target.moneyMax == null) continue;
        if(target.moneyAvailable == null) continue;
        if(!isHackReady(ns, target)) continue;

        // Determine the amount of money we're okay with hacking away.
        let money_goal = Math.max(0, target.moneyAvailable - (0.8 * target.moneyMax));
        if(money_goal <= 0) continue;
        log.debug(ns, `money goal determined: $${ns.format.number(money_goal, 0)}`, { host: target.hostname });

        let total_hack_threads = Math.floor(ns.hackAnalyzeThreads(target.hostname, money_goal));
        log.debug(ns, `total hack threads determined: ${ns.format.number(total_hack_threads, 0)}`, { host: target.hostname });

        // For each controlled server, determine how many threads we can allocate for hacking.
        for(const server of servers) {
            let ram_available = getAvailableRam(ns, server);
            log.debug(ns, `RAM available: ${ns.format.ram(ram_available)}`, { host: server.hostname });

            // Calculate how many threads are available for us on the server for a hack operation.
            let threads_available = Math.max(0, Math.floor(ram_available / ns.getScriptRam(constants.HACK_SCRIPT, server.hostname)));
            log.debug(ns, `threads available: ${ns.format.number(threads_available, 0)}`, { host: target.hostname });
            if(threads_available <= 0) continue;

            // Determine the number of hack threads to use.
            let hack_threads = Math.min(threads_available, total_hack_threads);
            log.debug(ns, `hack threads determined: ${ns.format.number(hack_threads, 0)}`, { host: target.hostname });
            if(hack_threads <= 0) continue;

            // If there's already a script hacking our target on this server, then skip this server.
            if(ns.getRunningScript(constants.HACK_SCRIPT, server.hostname, target.hostname)) continue;

            // Start our hack process!
            if(dry_run) {
                log.warn(ns, `skipping running of hack script due to --dry-run flag!`, { host: server.hostname });
            } else {
                log.info(ns, `starting HACK script targeting ${target.hostname}`, { host: server.hostname });
                let pid = ns.exec(constants.HACK_SCRIPT, server.hostname, { threads: hack_threads }, target.hostname);
                if(!pid) {
                    log.error(ns, `unable to start hack script`, { host: server.hostname });
                }
            }

            // Adjust our hack threads count.
            total_hack_threads = Math.max(0, total_hack_threads - hack_threads);
            log.debug(ns, `total hack thread remaining: ${ns.format.number(total_hack_threads, 0)}`, { host: target.hostname });

            // If we don't need to grow any more, break out of this loop.
            if(total_hack_threads <= 0) break;
        }
    }
}