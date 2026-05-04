// This script works to consistently skim money from a single server.
// It operates by analyzing potential actions, with the given priority:
// - weaken the security of the server
// - grow the money on the server
// - hack the server for money
import { NS } from "@ns";
import { log } from "/lib/log";

const WEAKEN_SECURITY_DELTA = 0.05;

// The script will only perform one action per iteration, and will wait for the action to complete before analyzing again.
export async function main(ns: NS) {
  ns.disableLog("ALL");

  var target: string = ns.getHostname();
  if(ns.args.length > 0) {
    target = ns.args[0] as string;
  }
  // ns.printf(`skimming server ${colors.red}%s${colors.reset}...`, target);
  log.info(ns, `skimming server`, { host: target });

  if(target == "home") return;
  await simple_skim(ns, target);
}

/**
 * Continuously analyzes and skims money from a target server.
 * This function utilizes some information about the host, but
 * only uses about 0.95GB of RAM.
 * 
 * This function should:
 * - Analyze the server's current state (security, money, etc.)
 * - Decide whether to weaken, grow, or hack based on priorities
 * - Perform only one action per iteration and wait for completion
 * 
 * @param ns - The Netscript API object provided by Bitburner.
 * @param host - The hostname of the server to skim.
 * @returns A Promise that resolves when the loop is exited (typically never).
 */
async function simple_skim(ns: NS, host: string): Promise<void> {
  const threads = ns.getRunningScript("deploy/skim.js", host)?.threads || 1;

  while (true) {
    const securityLevel = ns.getServerSecurityLevel(host);
    const minSecurityLevel = ns.getServerMinSecurityLevel(host);
    const moneyAvailable = ns.getServerMoneyAvailable(host);
    const maxMoney = ns.getServerMaxMoney(host);
    const requiredHackingLevel = ns.getServerRequiredHackingLevel(host);

    // Determine if we need to perform a weaken action.
    if(securityLevel > (minSecurityLevel + threads * WEAKEN_SECURITY_DELTA)) {
      // ns.printf(`weakening ${colors.red}%s${colors.reset} due to high security level (%.2f > %.2f)...`, host, securityLevel, minSecurityLevel + threads * WEAKEN_SECURITY_DELTA);
      await ns.weaken(host);
      continue;
    }

    // Determine if we can and should hack the server.
    if(ns.getHackingLevel() >= requiredHackingLevel && moneyAvailable >= (0.75 * maxMoney)) {
      var money = await ns.hack(host);
      if(money <= 0) {
        // ns.printf(`failed to hack ${colors.red}%s${colors.reset}...`, host);
        continue;
      }
      // ns.printf(`hacked %s for ${colors.green}$%s${colors.reset} (%.2f%% of max money)`, host, ns.formatNumber(money), (money / maxMoney) * 100);
      ns.toast(`hacked ${host} for $${ns.format.number(money)}`, "success", 2500);
      continue;
    }

    // Otherwise grow the server.
    // ns.printf(`growing ${colors.red}%s${colors.reset} due to insufficient money (%.2f%% of max money)...`, host, (moneyAvailable / maxMoney) * 100);
    await ns.grow(host);
  }
}
