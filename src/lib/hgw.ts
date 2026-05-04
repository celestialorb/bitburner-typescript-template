// This module contains various functions related to common HGW
// (hack, grow, weaken) operations.

import { NS } from "@ns";
import { log } from "./log";

/**
 * Perform a hack against the given host with the given number of threads.
 * 
 * @param ns Netscript object
 * @param host The host machine to hack.
 * 
 * @remarks RAM cost: 0.1 GB
 */
export async function hack(ns: NS, host: string): Promise<number> {
    // If we aren't given any threads to hack with, simply return.
    log.info(ns, `performing hack`, { host: host });
    let earned = await ns.hack(host);
    if(!earned) {
        log.info(ns, `failed to hack target`, { host: host });
    } else {
        log.info(ns, `hacked target for $${ns.format.number(earned, 2)}`, { host: host });
    }
    return earned;
}

/**
 * Perform a grow against the given host with the given number of threads.
 * 
 * @param ns Netscript object
 * @param host The host machine to grow.
 * 
 * @remarks RAM cost: 0.15 GB
 */
export async function grow(ns: NS, host: string, threads: number = 1): Promise<number> {
    // If we aren't given any threads to grow with, simply return.
    if(threads <= 0) { return 0; }
    log.info(ns, `performing growth`, { host: host });
    let growth = await ns.grow(host);
    log.info(ns, `grew target by ${ns.format.number(growth, 2, 1000000)}%%`, { host: host });
    return growth;
}

/**
 * Perform a weaken against the given host with the given number of threads.
 * 
 * @param ns Netscript object
 * @param host The host machine to weaken
 * 
 * @remarks RAM cost: 0.15 GB
 */
export async function weaken(ns: NS, host: string): Promise<number> {
    // If we aren't given any threads to weaken with, simply return.
    log.info(ns, `performing weaken`, { host: host });
    let weakened = await ns.weaken(host);
    log.info(ns, `weakened target by ${ns.format.number(weakened, 2)}`, { host: host });
    return weakened;
}

/**
 * Represents the number of threads to allocate for each HGW (hack, grow, weaken) operation.
 * 
 * @property hack The number of threads to use for hacking.
 * @property grow The number of threads to use for growing.
 * @property weaken The number of threads to use for weakening.
 */
type HGWThreads = {
    hack: number;
    grow: number;
    weaken: number;
};

/**
 * Analyzes the target host and returns the optimal number of threads
 * to get the target machine towards a high-value, low-security state.
 * 
 * @param ns Netscript object.
 * @param host The name of the host machine to analyze.
 * @param threads The maximum number of threads we can use.
 * @param cores The number of cores we can use.
 * @returns The number of weaken, growth, and hack threads to use.
 */
export function analyze(ns: NS, host: string, threads: number, cores: number = 1): HGWThreads {
    // We prioritize weaken, so first determine the number of weaken actions
    // (i.e. threads) needed to weaken the host to its minimum state.
    let security_delta = ns.weakenAnalyze(1, cores);
    let security_delta_goal = ns.getServerSecurityLevel(host) - ns.getServerMinSecurityLevel(host);
    log.debug(ns, `security Δ (per thread): ${ns.format.number(security_delta, 2)}`, { host: host });
    log.debug(ns, `security Δ goal: ${ns.format.number(security_delta_goal, 2)}`, { host: host });

    // The number of threads we need for a weaken are the number of threads we have, or
    // the number of threads needed to lower the host to its minimum security level (minus 1) --
    // whichever is smaller.
    let weaken_threads = Math.min(Math.floor(security_delta_goal / security_delta), threads);
    log.debug(ns, `weaken threads: ${ns.format.number(weaken_threads, 2)}`, { host: host });

    // Adjust our remaining threads.
    threads -= weaken_threads;
    log.debug(ns, `remaining threads: ${ns.format.number(threads, 2)}`, { host: host });

    // Now, we prioritize growing a server second, so let's perform something similar.
    let money_delta_multiplier_goal = ns.getServerMaxMoney(host) / ns.getServerMoneyAvailable(host);
    log.debug(ns, `server money (MAX): $${ns.format.number(ns.getServerMaxMoney(host))}`, { host: host });
    log.debug(ns, `server money (available): $${ns.format.number(ns.getServerMoneyAvailable(host))}`, { host: host });

    let growth_threads = threads;
    if(Number.isFinite(money_delta_multiplier_goal)) {
        log.debug(ns, `money Δ multiplier goal: ${ns.format.number(money_delta_multiplier_goal)}`, { host: host });
        growth_threads = Math.min(ns.growthAnalyze(host, money_delta_multiplier_goal, cores), growth_threads);
    }
    log.debug(ns, `growth threads: ${ns.format.number(growth_threads, 2)}`, { host: host });

    // Again, adjust our remaining threads.
    threads -= growth_threads;
    log.debug(ns, `remaining threads: ${ns.format.number(threads, 2)}`, { host: host });

    // Whatever threads are left, we should use to hack the server.
    let hack_threads = threads;
    log.debug(ns, `hack threads: ${ns.format.number(hack_threads, 2)}`, { host: host });

    return {
        hack: hack_threads,
        grow: growth_threads,
        weaken: weaken_threads,
    }
}