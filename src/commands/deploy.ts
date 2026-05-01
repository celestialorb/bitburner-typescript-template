// This command will deploy everything under `deploy` and `lib`
// to every machine we have root access on.
// This command kill all currently running scripts on all nodes. 

import { NS } from "@ns";
import { log } from "/lib/log";
import { constants, traverse } from "/lib/util";

const DEPLOYMENT_PACKAGES = ["deploy/", "lib/"]

export async function main(ns: NS): Promise<void> {
    log.info(ns, "deploying control package to nodes...");

    // First, determine the collection of scripts to copy over.
    const SCRIPTS = DEPLOYMENT_PACKAGES.map((deployment) => ns.ls(constants.HOME, deployment)).flat();
    await traverse(ns, async(ns: NS, host: string) => {
        // If we don't have root access to the host, skip it.
        if(!ns.hasRootAccess(host)) return;

        // Remove any current versions of the deployment packages on the host.
        for(const deployment of DEPLOYMENT_PACKAGES) {
            let files = ns.ls(host, deployment);
            for(const file of files) {
                ns.rm(file, host);
            }
        }

        // Copy over each and every script to the host.
        ns.scp(SCRIPTS, host, constants.HOME);
    });
}