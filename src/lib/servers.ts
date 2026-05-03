// This module exports various functions related to available servers.

import { NS, Server } from "@ns";
import { constants } from "/lib/constants";
import { log } from "/lib/log";
import { traverse } from "/lib/util";

/**
 * Normalizes a given node/server.
 * 
 * @param node A Server object or the name of the server as a string.
 * @returns The name of the server as a string.
 */
function normalize(node: Server | string): string {
    return (typeof node === "string" ? node : node.hostname);
}

/**
 * Returns a numeric value of the "hackability" of a server.
 * This is effectively a measure of how much money can be made per unit of time
 * for a given server at its current state.
 * 
 * @param node A Server object or the name of the server as a string.
 * @returns A numeric value of the hackability of the server.
 */
function hackability(ns: NS, node: Server | string): number {
    const hostname = normalize(node);
    let server = ns.getServer(hostname);
    let moneyAvailable = ns.getServerMoneyAvailable(server.hostname);

    // Determine the portion of money one would steal with a successful, single-threaded hack.
    let portion = moneyAvailable * ns.hackAnalyze(server.hostname);

    // Then determine the amount of money per time we'd get.
    let rate = portion / ns.getHackTime(server.hostname);

    // Then take into account the chance that the hack is successful.
    let effective_rate = rate * ns.hackAnalyzeChance(server.hostname);
    
    return effective_rate;
}

/**
 * Deploys our control package to the given server.
 * 
 * @param ns The netscript object.
 * @param node A Server object or the name of the server as a string.
 */
export async function deploy(ns: NS, node: Server | string): Promise<void> {
    const hostname = normalize(node);

    // If the server isn't controlled, return early.
    if(!ns.hasRootAccess(hostname)) return;

    // Otherwise, determine all files
    log.info(ns, `deploying control package to nodes...`);
    
    // First, determine the collection of scripts to copy over.
    const SCRIPTS = constants.DEPLOYMENT_PACKAGES.map((d) => ns.ls(constants.HOME, d)).flat();
    await traverse(ns, async(ns: NS, host: string) => {
        // If we don't have root access to the host, skip it.
        if(!ns.hasRootAccess(host)) return;

        log.debug(ns, `deploying control package to node`, { host: host });

        // Remove any current versions of the deployment packages on the host.
        for(const deployment of constants.DEPLOYMENT_PACKAGES) {
            let files = ns.ls(host, deployment);
            for(const file of files) {
                ns.rm(file, host);
            }
        }

        // Copy over each and every script to the host.
        ns.scp(SCRIPTS, host, constants.HOME);
    });
}

/**
 * Attempts to conquer the given server.
 * 
 * @param ns The netscript object.
 * @param node A Server object or the name of the server as a string.
 */
export async function conquer(ns: NS, node: Server | string): Promise<void> {
    const hostname = normalize(node);

    // If we already have root access on the machine, return early.
    if(ns.hasRootAccess(hostname)) return;

    // Otherwise, try and conquer the host.
    log.info(ns, `attempting to conquer node`, { host: hostname });

    // Attempt to open as many ports as possible on the node.
    ns.brutessh(hostname);
    ns.ftpcrack(hostname);
    ns.relaysmtp(hostname);
    ns.httpworm(hostname);
    ns.sqlinject(hostname);
    let success = ns.nuke(hostname);

    // If we weren't successful, go ahead and return.
    if(!success) return;

    log.info(ns, `successfully conquered node!`, { host: hostname });
    ns.toast(`CONQUERED ${hostname}!`, "success", 10000);

    // Then, go ahead and deploy our control package to the newly conquered node.
    await deploy(ns, node);
}

/**
 * Returns whether or not the given object is of the traditional Server object.
 * 
 * @param server The given object to typecheck.
 * @returns Whether or not it is a traditional Server.
 */
function isServer(server: any): server is Server {
  return server !== null
    && typeof server === "object"
    && typeof server.hostname === "string"
    && typeof server.hasAdminRights === "boolean"
    && typeof server.maxRam === "number"
    && typeof server.ramUsed === "number";
}


/**
 * Returns the set of all known servers, excluding the home server.
 * 
 * @param ns The netscript object.
 * @returns A set of all known servers.
 */
export async function getAllServers(ns: NS): Promise<Set<Server>> {
    let servers = new Set<Server>();

    await traverse(ns, async(ns: NS, node: string) => {
        const server = ns.getServer(node);

        // If we don't have a traditional server, return early.
        if(!isServer(server)) return;

        // Otherwise, add it to the set.
        servers.add(server);
    });
    return servers;
}

/**
 * Returns the set of all hackable servers.
 * 
 * @param ns The netscript object.
 * @returns A set of all known hackable servers.
 */
export async function getAllHackableServers(ns: NS): Promise<Set<Server>> {
    let servers = new Set<Server>();

    await traverse(ns, async(ns: NS, node: string) => {
        let server = ns.getServer(node);

        // If we don't have a traditional server, return early.
        if(!isServer(server)) return;

        // Attempt to conquer the node.
        await conquer(ns, node);

        // If we don't control it, skip it.
        if(!server.hasAdminRights) return;
        log.debug(ns, `server has admin rights`, { host: server.hostname });

        // If we purchased the server, skip it.
        if(server.purchasedByPlayer) return;
        log.debug(ns, `server wasn't purchased by player`, { host: server.hostname });

        // If the server doesn't have any money, skip it.
        const moneyMax = ns.getServerMaxMoney(node);
        const moneyAvailable = ns.getServerMoneyAvailable(node);
        log.debug(ns, `server has money`, { host: server.hostname });

        // Otherwise, add it to the set.
        servers.add(server);
    });
    return servers;
}

/**
 * Returns the set of all servers currently primed for hacking.
 * 
 * @param ns The netscript object.
 * @returns A list of servers primed for hacking, sorted by hackability.
 */
export async function getAllPrimedServers(ns: NS): Promise<Array<Server>> {
    let servers = await getAllHackableServers(ns);
    let ordered = servers.values().toArray().sort((a, b): number => {
        return (hackability(ns, a) - hackability(ns, b))
    });
    return ordered;
}

/**
 * Returns the set of all usable servers.
 * 
 * @param ns The netscript object.
 * @param includeHome Whether or not to include the home server.
 * @returns A set of all usable servers.
 */
export async function getAllUsableServers(ns: NS, includeHome: boolean = false): Promise<Set<Server>> {
    let servers = new Set<Server>();

    await traverse(ns, async(ns: NS, node: string) => {
        let server = ns.getServer(node);

        // If we don't have a traditional server, return early.
        if(!isServer(server)) return;

        if(server.hasAdminRights && server.maxRam > 0) {
            servers.add(server);
        }
    }, constants.HOME, !includeHome);
    return servers;
}

/**
 * Returns the amount of available RAM on the given server.
 * 
 * @param ns The netscript object.
 * @returns The amount of available RAM on the server in GB.
 */
export function getAvailableRam(ns: NS, node: Server | string): number {
    const hostname = normalize(node);
    return ns.getServerMaxRam(hostname) - ns.getServerUsedRam(hostname)
}

/**
 * Returns whether or not a node is hack-ready.
 * 
 * @param ns The netscript object.
 * @param node A Server object or the name of the server as a string.
 * 
 * @returns Whether or not a node is ready to be hacked.
 */
export function isHackReady(ns: NS, node: Server | string): boolean {
    const hostname = normalize(node);

    let server = ns.getServer(hostname);

    // If we don't have a traditional server, return early.
    if(!isServer(server)) return false;

    // Ensure we have admin rights on the server.
    if(!server.hasAdminRights) return false;

    // Ensure the server has money.
    if(server.moneyMax == null) return false;
    if(server.moneyAvailable == null) return false;

    // Ensure we're above 80% of the maximum money on the server.
    let value_percentage = server.moneyAvailable / server.moneyMax;
    return (value_percentage >= 0.8);
}