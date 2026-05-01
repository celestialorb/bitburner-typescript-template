/**
 * This module contains common functions for dealing with the market.
 */

import { NS } from "@ns";

/**
 * Returns the prospect of a given stock symbol.
 * 
 * @param ns The netscript object.
 * @param symbol The ticker symbol.
 */
function getProspect(ns: NS, symbol: string): number {
    let baseline = (ns.stock.getForecast(symbol) - 0.5) * ns.stock.getVolatility(symbol);
    return baseline * ns.stock.getPrice(symbol);
}

/**
 * Sorts the given set of stock symbols by prospect.
 * 
 * @param ns The netscript object.
 * @param symbols The set of stock symbols to sort.
 * @returns The sorted array of stock symbols, in order of decreasing prospect.
 */
function sortByProspect(ns: NS, symbols: Set<string>): string[] {
    // Sort the set of symbols by potential prospect.
    return symbols.values().toArray().sort((a: string, b: string): number => {
        return getProspect(ns, a) - getProspect(ns, b);
    });
}

/**
 * Returns a list of stocks forecasted to increase, sorted by volatility.
 * 
 * @param ns The netscript object.
 * @param threshold The threshold of the forecast.
 */
export function getAllRisingStocks(ns: NS, threshold: number = 0.6): string[] {
    let results = new Set<string>();

    let symbols = ns.stock.getSymbols();
    for(const symbol of symbols) {
        let forecast = ns.stock.getForecast(symbol);

        // If the symbol's forecast is less than our threshold, then skip it.
        if(forecast < threshold) continue;

        // Otherwise, add it to our results.
        results.add(symbol);
    }
    return sortByProspect(ns, results);
}

/**
 * Returns a list of stocks forecasted to increase, sorted by volatility.
 * 
 * @param ns The netscript object.
 * @param threshold The threshold of the forecast.
 */
export function getAllFallingStocks(ns: NS, threshold: number = 0.4): string[] {
    let results = new Set<string>();

    let symbols = ns.stock.getSymbols();
    for(const symbol of symbols) {
        let forecast = ns.stock.getForecast(symbol);

        // If the symbol's forecast is greater than our threshold, then skip it.
        if(forecast > threshold) continue;

        // Otherwise, add it to our results.
        results.add(symbol);
    }
    return sortByProspect(ns, results).reverse();
}

/**
 * Liquidates all stock held.
 * 
 * @param ns The netscript object.
 */
export function liquidate(ns: NS): void {
    // Get all stock symbols.
    const symbols = ns.stock.getSymbols();
    for(const symbol of symbols) {
        const [longs, , shorts, ] = ns.stock.getPosition(symbol);

        // Sell any symbols we currently have shares of.
        ns.stock.sellStock(symbol, longs);

        // Buy back any shorts we currently have.
        ns.stock.buyShort(symbol, shorts);
    }
}