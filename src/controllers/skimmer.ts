// This controller allows us to control how we skim money from hacked machines.

import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
    // Disable all built-in logging for standard Netscript functions.
    ns.disableLog("ALL");
   
    while(true) {
        // await ns.hack("n00dles");
        await ns.sleep(1000);
    }
}