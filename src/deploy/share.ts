// This script simply shares as much memory as possible from the given node.

import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
    ns.disableLog("ALL");
    await ns.share();
}