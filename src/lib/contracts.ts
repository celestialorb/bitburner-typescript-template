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
        case "Total Number of Primes":
            answer = primes(contract.data);
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


// Total Number of Primes
// You are attempting to solve a Coding Contract. You have 10 tries remaining, after which the contract will self-destruct.


// You are given two random non-negative integers: 1920364,2061793. 
//  The first will be up to 5000000, and the second will be at most 1000000 greater. 
//  Determine the amount of prime numbers between them (including the numbers given). 
 
//  Example: 
//  The range of [0,20] contains the primes [2,3,5,7,11,13,17,19], resulting in an answer of 8. 
/**
 * Calculate the number of primes between the two given elements.
 * 
 * @param data A two-element array of non-negative integers.
 * @returns The number of primes between the two integers given.
 */
function primes(data: number[]): number {
    // Sanity check our input by sorting it.
    data = data.sort();

    // Keep record of any primes between our integers.
    let count = 0;

    // Start by generating a prime sieve up to the larger integer.
    const start = data[0];
    const final = data[1];
    let primes: number[] = [];
    for(let ii = 2; ii <= final; ii++) {
        for(const prime of primes) {
            // If our test number is divisible by one of our primes, then break out the loop early.
            if(ii % prime == 0) break;
            
            // If we've reached over half of our square root of the test number, break out of the loop early.
            if(prime * prime > ii) break;
        }

        // Otherwise, we've found a prime, add it to our collection.
        primes.push(ii);

        // If this prime is between our integers, then count it.
        if(start <= ii && ii <= final) count++;
    }

    // Generate a prime sieve, then iterate through it to find all primes inbetween.
    return count;
}

/**
 * Calculate the total number of ways to sum the given number.
 * 
 * @param data The number to calculate the total number of ways to sum.TODO
 * @returns The total number of ways to sum to the given number.
 */
function twts(data: number): number {
    // Create a cache of answers for previously evaluated inputs.
    let summations: Map<number, number> = new Map<number, number>();

    // Prime the cache with the number of summations for the number 1.
    summations.set(1, 0);

    // The iterator variable ii represents the number we're trying to determine
    // the number of summations.
    for(let ii = 2; ii <= data; ii++) {
        let totalSummations = 0;
        const first = (summations.get(ii - 1) || 0) + 1;
        const second = (ii - first);

        // The iterator variable jj represents the "anchor" summation that we're calculating.
        for(let jj = ii - 1; jj > ii / 2; jj--) {
            // Each number can be broken apart into two "summations".
            // The total number of ways to sum to the current number
            // is then the number of ways to sum to the first number
            // multiplied by the second number (plus one).
            //
            // For example, the total number of ways to sum to the number
            // 3 is 2:
            // 2 + 1
            // 1 + 1 + 1
            // This is because there is only one way to represent the number 1,
            // and two ways to sum to the number 2, one of which is the number itself.
            const sums = ((summations.get(jj) || 0) + 1) * ((summations.get(ii)  || 0) + 1);
        }
        
        // Record the total number of different summations 
        summations.set(ii, totalSummations);
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