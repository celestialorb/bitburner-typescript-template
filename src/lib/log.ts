// This module defines some common logging functions.

import { CodingContractObject, NS } from "@ns";
import { colors } from "/lib/colors";

let TERMINAL = false;

export function setTerminal(terminal: boolean) {
    TERMINAL = terminal;
}

enum LogLevel {
    SUCC = "SUCC",
    INFO = "INFO",
    WARN = "WARN",
    ERROR = "ERRO",
    DEBUG = "DEBG"
}

const LogLevelColors: Record<LogLevel, string> = {
    [LogLevel.SUCC]: colors.green,
    [LogLevel.INFO]: colors.blue,
    [LogLevel.WARN]: colors.yellow,
    [LogLevel.ERROR]: colors.red,
    [LogLevel.DEBUG]: colors.magenta,
};

type LogMessageContext = {
    host?: string | null;
    contract?: {
        filename: string,
        hostname: string,
    }
};

/**
 * Returns a stylized string for a host machine.
 * 
 * @hostname The name of the machine.
 * @returns The stylized machine text.
 */
function host(hostname: string): string {
    return `${colors.cyan}${hostname}${colors.reset}`;
}

/**
 * Returns a stylized string for a contract.
 * 
 * @filename The filename of the contract.
 * @hostname The hostname of the machine the contract lives on.
 * @returns The stylized contract text.
 */
function contract(filename: string, hostname: string): string {
    return `${colors.yellow}${filename}${colors.reset}${host(hostname)}`;
}

/**
 * Logs a message from the script.
 * 
 * @param ns Netscript object.
 * @param msg The message to log.
 * @param level The level of the log message.
 * @param context Additional logging context, such as the host.
 */
function write(ns: NS, msg: string, level: LogLevel, context: LogMessageContext = {}): void {
    let prefix = `[${LogLevelColors[level]}${level}${colors.reset}]`
    if(context.host) {
        prefix += `.${host(context.host)}`;
    }
    if(context.contract) {
        prefix += `.${contract(context.contract.filename, context.contract.hostname)}`;
    }
    if(TERMINAL) {
        ns.tprintf(`${prefix}: ${msg}`)
    } else {
        ns.printf(`${prefix}: ${msg}`)
    }
}

/**
 * Logs a message from the script at the DEBUG level.
 * 
 * @param ns Netscript object.
 * @param msg The message to log.
 * @param context Additional logging context, such as the host.
 */
function debug(ns: NS, msg: string, context: LogMessageContext = {}): void {
    write(ns, msg, LogLevel.DEBUG, context);
}

/**
 * Logs a message from the script at the SUCCESS level.
 * 
 * @param ns Netscript object.
 * @param msg The message to log.
 * @param context Additional logging context, such as the host.
 */
function success(ns: NS, msg: string, context: LogMessageContext = {}): void {
    write(ns, msg, LogLevel.SUCC, context);
}

/**
 * Logs a message from the script at the INFO level.
 * 
 * @param ns Netscript object.
 * @param msg The message to log.
 * @param context Additional logging context, such as the host.
 */
function info(ns: NS, msg: string, context: LogMessageContext = {}): void {
    write(ns, msg, LogLevel.INFO, context);
}

/**
 * Logs a message from the script at the WARNING level.
 * 
 * @param ns Netscript object.
 * @param msg The message to log.
 * @param context Additional logging context, such as the host.
 */
function warn(ns: NS, msg: string, context: LogMessageContext = {}): void {
    write(ns, msg, LogLevel.WARN, context);
}

/**
 * Logs a message from the script at the ERROR level.
 * 
 * @param ns Netscript object.
 * @param msg The message to log.
 * @param context Additional logging context, such as the host.
 */
function error(ns: NS, msg: string, context: LogMessageContext = {}): void {
    write(ns, msg, LogLevel.ERROR, context);
}

export const log = {
    success,
    debug,
    info,
    warn,
    error,
};