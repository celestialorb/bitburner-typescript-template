// This controller manages our Hacknet nodes.

import { NS } from "@ns";
import { log } from "/lib/log";

const BASE_NODE_INCOME = 1.5; // Base income per second for a Hacknet Node
const MONEY_RESERVE = 500e3; // Amount of money to reserve for other purchases (e.g., servers, scripts, etc.)
const MAX_NODES = 25;


/**
 * Continuously manages our Hacknet nodes.
 * 
 * This function should:
 * - analyze the income-per-time of potential purchases
 * - always purchase the most efficient node upgrade (purchase, level, RAM, or cores)
 * 
 * @param ns - The Netscript API object provided by Bitburner.
 * @returns A Promise that resolves when the loop is exited (typically never).
 */
export async function main(ns: NS): Promise<void> {
    ns.disableLog("ALL");
    while(true) {
        let upgraded = determineUpgrade(ns);
        if(!upgraded) { await ns.sleep(1000); }
    }
}

/**
 * Determine the maximum number of HackNet servers we want for our
 * given progress.
 * 
 * @param ns The netscript object.
 * @returns The maximum number of HackNet nodes.
 */
function getMaxNodes(ns: NS): number {
    return Math.max(0, Math.floor(ns.getPlayer().skills.hacking / 20));
}

/**
 * Determine the maximum HackNet node level for each node.
 * 
 * @param ns The netscript object.
 * @returns The maximum allowed HackNet level.
 */
function getMaxLevel(ns: NS): number {
    return Math.min(200, Math.max(0, ns.getPlayer().skills.hacking / 2));
}

function determineUpgrade(ns: NS): boolean {
    // First, analyze each node of our Hacknet and determine
    // the most efficient upgrade.
    // NOTE: Unfortunately we can't get the increase in production rate
    // from the Hacknet API until later, so for now we simply select the
    // cheapest upgrade.
    var cheapestUpgradeCost = Number.POSITIVE_INFINITY;
    var cheapestUpgradeNode = -1;
    var cheapestUpgradeType = "";

    const nodes = ns.hacknet.numNodes();
    for(let ii = 0; ii < nodes; ii++) {
        const node = ns.hacknet.getNodeStats(ii);
        const levelUpgradeCost = ns.hacknet.getLevelUpgradeCost(ii, 1);
        const ramUpgradeCost = ns.hacknet.getRamUpgradeCost(ii, 1);
        const coreUpgradeCost = ns.hacknet.getCoreUpgradeCost(ii, 1);
        // var cacheUpgradeCost = ns.hacknet.getCacheUpgradeCost(ii, 1);

        if(levelUpgradeCost < cheapestUpgradeCost && node.level < getMaxLevel(ns)) {
            cheapestUpgradeCost = levelUpgradeCost;
            cheapestUpgradeNode = ii;
            cheapestUpgradeType = "level";
        }

        if(ramUpgradeCost < cheapestUpgradeCost) {
            cheapestUpgradeCost = ramUpgradeCost;
            cheapestUpgradeNode = ii;
            cheapestUpgradeType = "ram";
        }

        if(coreUpgradeCost < cheapestUpgradeCost) {
            cheapestUpgradeCost = coreUpgradeCost;
            cheapestUpgradeNode = ii;
            cheapestUpgradeType = "core";
        }

        // if(cacheUpgradeCost < cheapestUpgradeCost) {
        //     cheapestUpgradeCost = cacheUpgradeCost;
        //     cheapestUpgradeNode = ii;
        //     cheapestUpgradeType = "cache";
        // }
    }

    // Then, compare it against purchasing an entirely new node.
    var newNodeCost = ns.hacknet.getPurchaseNodeCost();
    if(newNodeCost < cheapestUpgradeCost && ns.hacknet.numNodes() < getMaxNodes(ns)) {
        cheapestUpgradeCost = newNodeCost;
        cheapestUpgradeNode = -1;
        cheapestUpgradeType = "new";
    }

    // If we have enough money to purchase the cheapest upgrade, do it.
    if(ns.getPlayer().money >= (cheapestUpgradeCost + MONEY_RESERVE)) {
        log.debug(ns, `purchasing hacknet upgrade: ${cheapestUpgradeType} for hacknet-node-${cheapestUpgradeNode} for $${ns.format.number(cheapestUpgradeCost, 0)}`)

        switch(cheapestUpgradeType) {
            case "level":
                ns.hacknet.upgradeLevel(cheapestUpgradeNode, 1);
                break;
            case "ram":
                ns.hacknet.upgradeRam(cheapestUpgradeNode, 1);
                break;
            case "core":
                ns.hacknet.upgradeCore(cheapestUpgradeNode, 1);
                break;
            // case "cache":
            //     ns.hacknet.upgradeCache(cheapestUpgradeNode, 1);
            //     break;
            case "new":
                ns.hacknet.purchaseNode();
                break;
        }

        return true;
    }
    return false;
}