// This module provides utility functions for use in other scripts.

import { NS } from "@ns";
// export { colors } from "/lib/colors";
// export { log } from "/lib/log";

/**
 * @TODO
 */
export namespace constants {
  export const HOME = "home";
  export const VICTIM_PORT = 111;
  export const WEAKEN_SECURITY_DELTA = 0.05;
}

/**
 * Returns the maximum number of threads for a script a node can run.
 * @param ns Netscript object.
 * @param node The node to run the script on.
 * @param script The filename of the script.
 */
export function getMaximumThreads(ns: NS, node: string, script: string): number {
  let available = ns.getServerMaxRam(node) - ns.getServerUsedRam(node);
  ns.printf("%s available RAM: %s", node, available);
  ns.printf("%s RAM for script: %s", node, ns.getScriptRam(script, node));
  let threads = Math.floor(available / ns.getScriptRam(script, node));
  ns.printf("%s: calculated threads: %s", node, threads);
  if(threads == Infinity) {
    threads = 0;
  }
  return threads;
}

/**
 * Comparator function to determine which node is
 * "easier" to start hacking.
 */
function compareHackableNodes(ns: NS, a: string, b: string): number {
  const moneyA = ns.getServerMoneyAvailable(a);
  const securityA = ns.getServerBaseSecurityLevel(a);
  const moneyB = ns.getServerMoneyAvailable(b);
  const securityB = ns.getServerBaseSecurityLevel(b);

  // Determine which node would take less time to position
  // into a hacking state. This is the amount of time it
  // would take to weaken the server to minimum security,
  // and grow it to maximum money. This is just a rough
  // estimation as we're only using it to compare the nodes.
  const weakensA = Math.ceil((ns.getServerSecurityLevel(a) - ns.getServerMinSecurityLevel(a)) / ns.weakenAnalyze(1));
  const weakensB = Math.ceil((ns.getServerSecurityLevel(b) - ns.getServerMinSecurityLevel(b)) / ns.weakenAnalyze(1));
  
//   const growsA = Math.ceil(Math.log(ns.getServerMaxMoney(a) / moneyA) / Math.log(ns.growthAnalyze(a, 1)));
//   const growsB = Math.ceil(Math.log(ns.getServerMaxMoney(b) / moneyB) / Math.log(ns.growthAnalyze(b, 1)));
  // const timeA = weakensA + growsA;
  // const timeB = weakensB + growsB;

  const timeA = weakensA + 0;
  const timeB = weakensB + 0;

  return (timeB - timeA);
}

/**
 * Returns whether or not a node is in a fully weakened state.
 * @param ns Netscript object.
 * @param node The hostname of the node.
 */
export function isWeakened(ns: NS, node: string) {
  return (ns.getServerSecurityLevel(node) <= ns.getServerMinSecurityLevel(node));
}

/**
 * Returns whether or not a node is in a fully grown state.
 * @param ns Netscript object.
 * @param node The hostname of the node.
 */
export function isGrown(ns: NS, node: string) {
  return (ns.getServerMoneyAvailable(node) >= ns.getServerMaxMoney(node));
}

/**
 * Returns a collection of all hacked nodes in the network.
 * @param ns Netscript object.
 */
export async function getHackedNodes(ns: NS): Promise<Set<string>> {
  let nodes: Set<string> = new Set<string>();
  await traverse(ns, async (ns: NS, node: string) => {
    if (ns.hasRootAccess(node) && node !== "home") {
      nodes.add(node);
    }
  });
  return nodes;
}

/**
 * Returns a sorted list of all nodes in the network
 * that we have root access on, excluding purchased nodes
 * (and the home node). Sorted by "ease" of a target, which
 * ideally would be the amount of time it takes to get a target
 * into a hackable position (high money, low security).
 * @param ns Netscript object.
 */
export function getHackableNodes(ns: NS): string[] {
  const hackableNodes: string[] = [];
  traverse(ns, async (ns: NS, node: string) => {
    if (ns.hasRootAccess(node) && node !== "home") {
      hackableNodes.push(node);
    }
  });
  hackableNodes.sort((a, b) => {
    // Example: sort by server money available, descending
    return ns.getServerMoneyAvailable(b) - ns.getServerMoneyAvailable(a);
    });
  return hackableNodes;
}

/**
 * Recursively traverses the network, calling the callback for each node.
 * @param ns Netscript object
 * @param callback Function to call for each node name
 * @param startHost Host to start from (default: "home")
 * @param skipHome Boolean determining whether or not to include the home node.
 */
export async function traverse(
  ns: NS,
  callback: (ns: NS, node: string) => Promise<void>,
  startHost: string = "home",
  skipHome: boolean = true,
) {
  const seen = new Set<string>();
  async function dfs(host: string) {
    if(seen.has(host)) return;
    seen.add(host);
    if(!(skipHome && host === "home")) await callback(ns, host);
    for(const neighbor of ns.scan(host)) {
      await dfs(neighbor);
    }
  }
  await dfs(startHost);
}
