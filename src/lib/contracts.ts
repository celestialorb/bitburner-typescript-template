/**
 * This module provides common functionality for dealing with contracts.
 */

import { NS } from "@ns";
import { log } from "/lib/log";
import { constants, traverse } from "/lib/util";

/**
 * Finds all unsolved contracts on the network.
 *
 * @param ns The netscript object.
 * @returns A map of contract name to host machine.
 */
export async function getAllContracts(ns: NS): Promise<Map<string, string>> {
    let contracts = new Map<string, string>();

    await traverse(ns, async(ns: NS, host: string) => {
        const files = ns.ls(host);
        for(const file of files) {
            if(!file.endsWith(".cct")) continue;
            contracts.set(file, host);
        }
    });

    return contracts;
}

/**
 * Generates dummy contracts for each type.
 * 
 * @param ns The netscript object.
 */
export function generate(ns: NS): void {
    const contractTypes = ns.codingcontract.getContractTypes();
    for(const contractType of contractTypes) {
        const filename = ns.codingcontract.createDummyContract(contractType, constants.HOME);
        log.info(ns, `generated ${contractType}@${filename}`, { host: constants.HOME });
    }
}

/**
 * Solves a given contract by determining the solution and submitting it.
 * 
 * @param filename The name of the contract file.
 * @param hostname The name of the machine the contact exists on.
 * @param dry_run Whether or not to actually attempt to solve the contract.
 * @returns Whether or not the contract was solved.
 */
export function solve(ns: NS, filename: string, hostname: string, dry_run: boolean): boolean {
    const contract = ns.codingcontract.getContract(filename, hostname);
    let answer = null;
    switch(contract.type) {
        case "Algorithmic Stock Trader II":
            answer = ast2(contract.data);
            break;
        case "Algorithmic Stock Trader III":
            answer = ast3(contract.data);
            break;
        case "Total Ways to Sum":
            answer = twts(contract.data);
            break;
        default:
            log.error(ns, `${filename} on ${hostname} is an unknown contract!`);
            return false;  
    }

    // Otherwise, submit the answer.
    log.info(ns, `solving ${filename} on ${hostname}`);
    log.info(ns, `${contract.type}: ${contract.data.toString()} => ${answer}`);
    log.debug(ns, `contract has ${contract.numTriesRemaining()} tries remaining`);

    // If we're in a dry run, then don't submit the answer.
    if(dry_run) {
        log.debug(ns, `not submitting answer due to dry-run...`);
        return false;
    }

    // Otherwise, submit the answer
    const result = contract.submit(answer.toString());
    return (result != "");
}

/**
 * Calculate the total number of ways to sum the given number.
 * 
 * @param data The number to calculate the total number of ways to sum.
 * @returns The total number of ways to sum to the given number.
 */
function twts(data: number): number {
    let summations: Map<number, number> = new Map<number, number>();
    summations.set(1, 1);
    // summations.set(2, 1);
    for(let ii = 2; ii < data; ii++) {
        for(let jj = 1; jj < ii; jj++) {

        }
    }
    return summations.get(data) || 0;
}

/**
 * Preprocess data for any algorithmic stock traders.
 * This function will remove duplicate stock prices as well as
 * remove any data inbetween sequential rises or falls of the stock price.
 * 
 * @param data The array of stock prices.
 * @returns The processed array of stock prices.
 */
function ast_process(data: number[]): number[] {
    // Sanity check for an early return.
    if(data.length <= 1) return data;

    // Preprocess the data to remove consecutive rises/falls.
    let duplicates_removed = [];

    // Start by removing duplicates.
    for(let ii = 0; ii < data.length; ii++) {
        // If we encounter duplicates, remove them by skipping to the next iteration.
        if(data[ii] == data[ii + 1]) continue;
        duplicates_removed.push(data[ii]);
    }

    // Then remove any data that is sequentially rising or falling.
    let processed = [];
    let trend = duplicates_removed[1] > duplicates_removed[0];
    for(let ii = 1; ii < duplicates_removed.length - 1; ii++) {
        const current = duplicates_removed[ii];
        const next = duplicates_removed[ii + 1];
        const next_trend = next > current;

        // If our trend is switching, add the current data point.
        if(trend != next_trend) {
            processed.push(current);
        }

        // Reevaluate whether or not the data is rising.
        trend = next > current;
    }

    // If the final trend was rising, add on the last data point.
    if(trend) {
        processed.push(duplicates_removed[duplicates_removed.length - 1]);
    }
    return processed;
}

// Algorithmic Stock Trader II
// You are given the following array of stock prices (which are numbers) where the i-th element represents the stock price on day i:

//  126,5,171,86,41,28,183

//  Determine the maximum possible profit you can earn using as many transactions as you'd like. A transaction is defined as buying and then selling one share of the stock. Note that you cannot engage in multiple transactions at once. In other words, you must sell the stock before you buy it again.

//  If no profit can be made, then the answer should be 0.
export function ast2(data: number[]): number {
    // Preprocess our data.
    data = ast_process(data);

    // The resulting data after processing should only contain pairs of rises.
    let profit = 0;
    for(let ii = 0; ii < data.length; ii += 2) {
        const start = data[ii];
        const final = data[ii + 1];
        profit += (final - start);
    }
    return profit;
}

// Algorithmic Stock Trader III
// You are given the following array of stock prices (which are numbers) where the i-th element represents the stock price on day i:

//  164,42,95,173,105,122,107,21,18,25,92,19,31,129,166

//  Determine the maximum possible profit you can earn using at most two transactions. A transaction is defined as buying and then selling one share of the stock. Note that you cannot engage in multiple transactions at once. In other words, you must sell the stock before you buy it again.

//  If no profit can be made, then the answer should be 0.
export function ast3(data: number[]): number {
    // Preprocess our data to return only pairs of trends.
    data = ast_process(data);

    // Calculate potential profit from each pair.
    let profits = [];
    for(let ii = 0; ii < data.length; ii += 2) {
        const start = data[ii];
        const final = data[ii + 1];
        profits.push(final - start);
    }

    // Sort our potential profits.
    profits = profits.sort().reverse();

    // Edge cases: handle no trends to profit upon, and handle only one trend.
    if(profits.length <= 0) return 0;
    if(profits.length == 1) return profits[0];

    // Return the total of the two highest pairs.
    return profits[0] + profits[1];
}

// Algorithmic Stock Trader IV
// You are attempting to solve a Coding Contract. You have 10 tries remaining, after which the contract will self-destruct.


// You are given the following array with two elements:

// [2, [136,157,117,122,16,156,199,39,196,158,114,24,45,178,146,121,92,131,145,111,188,92,32,69,67,178,69,96,72,56,138,173,151,98,26]]

// The first element is an integer k. The second element is an array of stock prices (which are numbers) where the i-th element represents the stock price on day i.

// Determine the maximum possible profit you can earn using at most k transactions. A transaction is defined as buying and then selling one share of the stock. Note that you cannot engage in multiple transactions at once. In other words, you must sell the stock before you can buy it again.

// If no profit can be made, then the answer should be 0.


// If your solution is an empty string, you must leave the text box empty. Do not use "", '', or ``.

// My Own Assumptions
//  1. A "transaction" is buying one share of stock on one day and selling it at some point later.
// Solving manually with two transactions:
// Transaction 1: 16->199 (183)
// Transaction 2: 39->196 (157) or 24->188 (164)
// Total: 183 + 164 = 347
// Example Data: [2, [136,157,117,122,16,156,199,39,196,158,114,24,45,178,146,121,92,131,145,111,188,92,32,69,67,178,69,96,72,56,138,173,151,98,26]]
// Expected Output: 347
/**
 * Solves the Algorithmic Stock Trader IV contract problem.
 * 
 * @param data The contract data.
 * @returns The maximum possible profit that can be earned.
 */
export function ast4(data: number[]): string {
    // Grab the maximum number of transactions that can be used.
    const transactions = data[0] as number;

    // Generate potential profit for every profitable pair of days (i.e. transactions).
    // Then take the highest earning transactions and determine if they overlap.
    return ""
}