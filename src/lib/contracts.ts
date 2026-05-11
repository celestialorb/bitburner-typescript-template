/**
 * This module provides common functionality for dealing with contracts.
 */

import { NS, CodingContractName } from "@ns";
import { log } from "/lib/log";
import { constants, traverse } from "/lib/util";

const TEST_SOLUTIONS: Map<CodingContractName, Function> = new Map<CodingContractName, Function>();
// TEST_SOLUTIONS.set("Algorithmic Stock Trader I", ast1);
// TEST_SOLUTIONS.set("Algorithmic Stock Trader II", ast2);
// TEST_SOLUTIONS.set("Algorithmic Stock Trader III", ast3);
// TEST_SOLUTIONS.set("Algorithmic Stock Trader IV", ast4);
TEST_SOLUTIONS.set("Compression I: RLE Compression", c1rle);
// TEST_SOLUTIONS.set("Array Jumping Game", ajg);
// TEST_SOLUTIONS.set("Total Number of Primes", primes);
// TEST_SOLUTIONS.set("Total Ways to Sum", twts);
// TEST_SOLUTIONS.set("Spiralize Matrix", spiralize);

const WORKING_SOLUTIONS: Map<CodingContractName, Function> = new Map<CodingContractName, Function>();
// WORKING_SOLUTIONS.set("Algorithmic Stock Trader I", ast1);
// WORKING_SOLUTIONS.set("Algorithmic Stock Trader II", ast2);
// WORKING_SOLUTIONS.set("Algorithmic Stock Trader III", ast3);
// WORKING_SOLUTIONS.set("Algorithmic Stock Trader IV", ast4);
WORKING_SOLUTIONS.set("Array Jumping Game", ajg);
// WORKING_SOLUTIONS.set("Compression I: RLE Compression", c1rle);
WORKING_SOLUTIONS.set("Total Number of Primes", primes);
// WORKING_SOLUTIONS.set("Total Ways to Sum", twts);
// WORKING_SOLUTIONS.set("Spiralize Matrix", spiralize);

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
export function solve(ns: NS, filename: string, hostname: string, dry_run: boolean = false): boolean {
    // Retrieve our specific contract.
    const contract = ns.codingcontract.getContract(filename, hostname);

    // Retrieve our specific solution, or log an error and return early.
    const solution = WORKING_SOLUTIONS.get(contract.type);
    if(solution == null) {
        log.error(ns, `${filename} on ${hostname} is an unknown contract!`);
        return false;
    }

    // If we have a solution to use, determine the answer using it and submit it.
    const answer = solution(ns, contract.data);

    // Otherwise, submit the answer.
    log.info(ns, `solving ${filename} on ${hostname}`);
    log.info(ns, `${contract.type}: ${contract.data} => ${answer}`);
    log.debug(ns, `contract has ${contract.numTriesRemaining()} tries remaining`);

    // If we're in a dry run, then don't submit the answer.
    if(dry_run) {
        log.debug(ns, `not submitting answer due to dry-run...`);
        return false;
    }

    // Otherwise, submit the answer.
    const result = contract.submit(answer.toString());
    return (result != "");
}

/**
 * Test the solutions we have created.
 */
export function test(ns: NS, count: number = 100): void {
    // For every solution that exists within our SOLUTIONS map, create a contract
    // for that type, then attempt to solve it using our solution.
    const types = TEST_SOLUTIONS.keys();
    for(const type of types) {
        let success = false;
        for(let ii = 0; ii < count; ii++) {
            const filename = ns.codingcontract.createDummyContract(type, constants.HOME);
            if(filename == null) {
                log.error(ns, `unable to read contract ${filename}`);
                break;
            };

            log.info(ns, `attempting to solve ${type}`);
            success = success && solve(ns, filename, constants.HOME);
            if(!success) {
                log.error(ns, `failed to solve contract ${type}`);
                break;
            }
        }

        if(!success) continue;

        // If we passed a number of tests, report the solution as successful.
        log.success(ns, `successfully solved contract ${type}!`);
    }
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

// Algorithmic Stock Trader I
// You are given an array of numbers representing stock prices, where the
// i-th element represents the stock price on day i.
// 
// Determine the maximum possible profit you can earn using at most one
// transaction (i.e. you can buy an sell the stock once). If no profit
// can be made, then the answer should be 0. Note that you must buy the stock
// before you can sell it.
/**
 * Return the maximum possible profit.
 * 
 * @param data An array of stock prices.
 * @returns The maximum possible profit using at most one transaction.
 */
export function ast1(ns: NS, data: number[]): number {
    // Preprocess our data.
    data = ast_process(data);
    log.info(ns, data);

    // Examine each pair of prices and determine the largest.
    let largestProfit = 0;
    for(let ii = 0; ii < data.length; ii += 2) {
        const profit = data[ii + 1] - data[ii];
        largestProfit = Math.max(largestProfit, profit);
    }
    return largestProfit;
}

// Algorithmic Stock Trader II
// You are given the following array of stock prices (which are numbers) where the i-th element represents the stock price on day i:

//  126,5,171,86,41,28,183

//  Determine the maximum possible profit you can earn using as many transactions as you'd like. A transaction is defined as buying and then selling one share of the stock. Note that you cannot engage in multiple transactions at once. In other words, you must sell the stock before you buy it again.

//  If no profit can be made, then the answer should be 0.
export function ast2(ns: NS, data: number[]): number {
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
export function ast3(ns: NS, data: number[]): number {
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
export function ast4(ns: NS, data: number[]): string {
    // Grab the maximum number of transactions that can be used.
    const transactions = data[0] as number;

    // Generate potential profit for every profitable pair of days (i.e. transactions).
    // Then take the highest earning transactions and determine if they overlap.
    return ""
}

// Minimum Path Sum in a Triangle
// You are given a 2D array of numbers (array of array of numbers) that represents a
// triangle (the first array has one element, and each array has one more element than
// the one before it, forming a triangle). Find the minimum path sum from the top to the
// bottom of the triangle. In each step of the path, you may only move to adjacent
// numbers in the row below.
/**
 * Return the minimum path sum from the top to the bottom of the triangle.
 * 
 * @param data The triangle's definition.
 * @returns The minimum path sum from the top to the bottom of the triangle.
 */
function minimumPathSum(ns: NS, data: number[][]): number {
    // We start by constructing a graph out of our given triangle definition.

    // Once we have a graph, we iterate through a collection of pairs of origin and destination.
    // While we only have one origin, we have multiple possible destinations.
    // Then compute the minimum path sum of each origin + destination pairing.
    // The minimum path sum of this resulting set is then our solution.
    return 0;
}

// Array Jumping Game
// You are given an array of integers where each element represents the
// maximum possible jump distance from that position. For example, if you
// are at position i and your maximum jump length is n, then you can jump
// to any position from i to i+n.

// Assuming you are initially positioned at the start of the array, determine
// whether you are able to reach the last index of the array.
/**
 * Returns whether or not you are able to jump to the last index of the given array.
 * 
 * @param data The number of jumps allowed from each spot in the array.
 * @returns Whether or not it is possible to reach the last index of the array.
 */
function ajg(ns: NS, data: number[]): number {
    // Start from the last index of the array.
    // Examine each element moving towards the start of the array.
    // If it is possible to reach the end from a given element, then
    // start examining that element and recursively work our way back
    // to the start of the array.

    // Start with trying to examine our base case, can we reach the
    // end of the array (our goal) from the start of the array (our position)?
    if(data[0] >= data.length) return 1;

    // If we can't reach our goal from our position, then we start working
    // our way back from the goal towards the start. If we find a position
    // where we can reach the goal then we recurse and examine that case.
    for(let ii = data.length - 1; ii > 0; ii--) {
        // Determine the number of steps required from this position to reach
        // our goal.
        const steps = (data.length - ii);

        // If we can't reach our goal from this position, continue on.
        if(data[ii] < steps) continue;

        // Otherwise, we've found a _potential_ solution and we need
        // to recurse into it to examine it further.
        // We should create a new slice of our data to represent our
        // new problem space.
        const solution = ajg(ns, data.slice(0, ii));

        // If we found a solution, return back up that we have a solution.
        if(solution) return solution;

        // Otherwise, iterate to examine the next space.
    }

    // If we reached the start of the array and haven't found a solution,
    // then there is no solution and we return false.
    return 0;
}

// Find Largest Prime Factor
// Given a number, find its largest prime factor. A prime factor
// is a factor that is a prime number.
/**
 * Return the largest prime factor of the given number.
 * 
 * @param data The number.
 * @returns The largest prime factor of the number.
 */
function largestPrime(ns: NS, data: number): number {
    // Create and populate a prime sieve up to the square root of the given number.
    const limit = Math.sqrt(data);

    let primes: number[] = [2];
    let factor = 3;
    while(factor < limit) {
        const factorLimit = Math.sqrt(factor);
        for(const prime of primes) {

        }
        factor += 2;
    }
    return 0;
}

// Compression I: RLE Compression
// Run-length encoding (RLE) is a data compression technique which encodes data as a
// series of runs of a repeated single character. Runs are encoded as a length, followed
// by the character itself. Lengths are encoded as a single ASCII digit; runs of 10
// characters or more are encoded by splitting them into multiple runs.

// You are given a string as input. Encode it using run-length encoding with the minimum
// possible output length.

// Examples:
// aaaaabccc -> 5a1b3c
// aAaAaA -> 1a1A1a1A1a1A
// 111112333 -> 511233
// zzzzzzzzzzzzzzzzzzz -> 9z9z1z (or 9z8z2z, etc.)
/**
 * Return the RLE string with the minimum possible output length.
 * 
 * @param data The input string to encode.
 * @returns The RLE encoded minimum-length string.
 */
function c1rle(ns: NS, data: string): string {
    let result = "";
    let previous = data[0];
    let count = 1;
    for(let ii = 1; ii < data.length; ii++) {
        const current = data[ii];

        // If the current character matches the previous one,
        // increment our count and continue onto the next character.
        if(current == previous && count < 9) {
            count++;
            continue;
        }

        // Otherwise add our chunk to our result.
        result += `${count}${previous}`

        // Reset our count.
        count = 0;
    }
    return result;
}

// Generate IP Addresses
// Given a string containing only digits, return an array with all possible
// valid IP address combinations that can be created from the string.
// 
// An octet in the IP address cannot begin with ‘0’ unless the number itself
// is actually 0. For example, “192.168.010.1” is NOT a valid IP.
// 
// Examples:
// 25525511135 -> [255.255.11.135, 255.255.111.35]
// 1938718066 -> [193.87.180.66]
/**
 * Return all possible IP addresses possible that can be made out of the given number.
 */
function generateIpAddresses(ns: NS, data: string, octets: number = 4): string[] {
    // Start with a base case of not having any octets left.
    if(octets <= 0) return [];

    // If our string starts with a zero, return no possible address/octets.
    if(data.startsWith("0")) return [];

    // Otherwise, we have potentially valid data and we should determine our
    // possible subaddresses.

    return [];
}

// Spiralize Matrix
// Given an array of array of numbers representing a 2D matrix, return the
// elements of that matrix in clockwise spiral order.

// Example: The spiral order of

// [1, 2, 3, 4]
// [5, 6, 7, 8]
// [9, 10, 11, 12]

// is [1, 2, 3, 4, 8, 12, 11, 10, 9, 5, 6, 7]
/**
 * Return the spiral order of a matrix.
 * 
 * @param data The 2D matrix.
 * @return The 1D array of the elements of the matrix in clockwise spiral order.
 */
function spiralize(ns: NS, data: number[][]): number[] {
    // Declare our unspiralized matrix result.
    let result: number[] = [];

    // Declare our direction.
    let toTheRight = true;

    // For each row of the matrix.
    for(let row = 0; row < data.length; row++) {
        let rowData = data[row];
        for(let col = 0; col < rowData.length; col++) {
            let colIndex = col;
            if(!toTheRight) { colIndex = (rowData.length - 1) - col; }

            let value = rowData[colIndex];
            result.push(value);
        }
        toTheRight = !toTheRight;
    }

    // Return our result.
    return result;
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
function primes(ns: NS, data: number[]): number {
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
function twts(ns: NS, data: number): number {
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