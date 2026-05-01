import { NS } from "@ns";
import { ast3 } from "/lib/contracts";

export async function main(ns: NS): Promise<void> {
    const data = [164,42,95,173,105,122,107,21,18,25,92,19,31,129,166];
    ns.tprintf(ast3(data));
}