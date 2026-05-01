// This command kill all currently running scripts on all nodes. 

import { NS } from "@ns";
import { traverse } from "/lib/util";
import { conquer } from "/lib/servers";

export async function main(ns: NS): Promise<void> {
    await traverse(ns, async(ns: NS, host: string) => {
        conquer(ns, host);
    });
}