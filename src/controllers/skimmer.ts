// This controller allows us to control how we skim money from hacked machines.

import { NS } from "@ns";
import { colors, traverse } from "/lib/util";

const SOURCE_HOSTNAME = "home";

export async function main(ns: NS): Promise<void> {
    // Disable all built-in logging for standard Netscript functions.
    ns.disableLog("ALL");
    // while(true) {
    //     // Determine RAM usage of our skimming script.
    //     const RAM_USAGE = ns.getScriptRam("deploy/skim.js");

    //     traverse(ns, async(ns: NS, host: string) => {
    //         // If we don't have root access to the host, skip it.
    //         if(!ns.hasRootAccess(host)) {
    //             ns.printf(`skimmer skipping ${colors.red}%s${colors.reset} due to lack of root access...`, host);
    //             return;
    //         }

    //         // If the server doesn't have any money, skip it.
    //         if(ns.getServerMoneyAvailable(host) <= 0) {
    //             ns.printf(`skimmer skipping ${colors.red}%s${colors.reset} due to lack of money...`, host);
    //             return;
    //         }

    //         // Get RAM information about the server.
    //         var ram = ns.getServerMaxRam(host);

    //         // Determine number of threads we can run.
    //         var threads = Math.floor(ram / RAM_USAGE);

    //         // If we can't run a single thread, simply skip this host.
    //         if(threads < 1) {
    //             ns.printf(`skimmer skipping ${colors.red}%s${colors.reset} due to insufficient RAM...`, host);
    //             return;
    //         }

    //         // If there is already a skimming script running on the host, skip it.
    //         if(ns.getRunningScript("deploy/skim.js", host)) {
    //             ns.printf(`skimmer skipping ${colors.red}%s${colors.reset} because skimming script is already running...`, host);
    //             return;
    //         }

    //         ns.printf(`skimmer deploying to ${colors.green}%s${colors.reset} with %d threads...`, host, threads);

    //         // Otherwise, deploy our package to the host.
    //         ns.scp(ns.ls(SOURCE_HOSTNAME, "deploy/"), host, SOURCE_HOSTNAME);

    //         // Run our skimming script on the host with the maximum number of threads.
    //         ns.exec("deploy/skim.js", host, threads);
    //     });

    //     await ns.sleep(60000);
    // }
}