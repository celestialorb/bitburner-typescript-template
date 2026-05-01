// This Bitburner controller is intended to play the entire game for you.
// It acts as an entrypoint CLI for any commands.

import { NS } from "@ns";
import { constants } from "/lib/util";

export async function main(ns: NS): Promise<void> {
    let commands = ns.ls(constants.HOME, "commands/");
    commands = commands.map(command => command.replace(".js", ""));
    commands = commands.map(command => command.replace("commands/", ""))
    if(ns.args.length <= 0) {
        ns.tprintf("Usage: run %s <command>", ns.getScriptName());
        ns.tprintf("Available commands: %s", commands.join(", "));
        ns.exit();
    }

    let command = ns.args[0] as string;
    ns.spawn(`commands/${command}.js`, {spawnDelay: 0}, ...ns.args.slice(1));
}