// This module contains the definition for a controller for making money on the market.

import { NS } from "@ns";
import { log, setTerminal } from "/lib/log";
import { getAllFallingStocks, getAllRisingStocks, liquidate } from "/lib/market";

const MONEY_RESERVED = 1e9;
const SHORT_MONEY_LIMIT = 1e9;

/**
 * TODO
 */
export async function main(ns: NS): Promise<void> {
    // Disable all built-in Netscript logging.
    ns.disableLog("ALL");

    // Liquidate all stock at script exit.
    ns.atExit(() => {
        liquidate(ns);
    });

    // Define our flags.
    const flags = ns.flags([
        ["continuous", false],
        ["dry-run", false],
    ]);
    let dry_run = flags["dry-run"] as boolean;

    // If this is a dry run, print out the results to the terminal.
    setTerminal(dry_run);

    while(true) {
        // Get all potentially falling stock.
        let fallers = getAllFallingStocks(ns);

        // Sell all falling stocks and place shorts.
        for(const faller of fallers) {
            log.debug(ns, `[${faller}] forecasted falling stock`);
            const [longs, , shorts, ] = ns.stock.getPosition(faller);

            // If we don't have any shares, skip selling them.
            if(longs > 0) {
                log.debug(ns, `[${faller}] SELLING`);
                if(dry_run) {
                    log.info(ns, `[${faller}] dry-run enabled, would've sold ${ns.formatNumber(longs, 0)}`);
                } else {
                    let soldShares = ns.stock.sellStock(faller, longs);
                    log.info(ns, `[${faller}] sold ${ns.formatNumber(soldShares, 0)} shares`);
                }
            }

            // Determine how many shares we can short.
            const maxShortShares = Math.max(0, Math.floor(SHORT_MONEY_LIMIT / ns.stock.getPrice(faller)) - shorts);

            // Place shorts.
            // ns.stock.sellShort(faller, maxShortShares);
        }

        // Calculate our funds.
        let funds = Math.max(0, ns.getPlayer().money - MONEY_RESERVED);

        // Get all potentially rising stocks.
        let risers = getAllRisingStocks(ns);

        // Buy all rising stocks.
        for(const riser of risers) {
            log.debug(ns, `funds available: $${ns.formatNumber(funds, 0)}`);
            let price = ns.stock.getPrice(riser);
            let canBuyShares = Math.max(0, Math.floor(funds / price));
            log.info(ns, `[${riser}] can buy ${ns.formatNumber(canBuyShares, 0)} share(s)`);

            const [longs, , shorts, ] = ns.stock.getPosition(riser);

            // First buy back any shorts we have.
            // ns.stock.buyShort(riser, shorts);

            // Then buy long positions.
            let maxAvailableShares = ns.stock.getMaxShares(riser) - longs;
            let sharesToBuy = Math.min(canBuyShares, maxAvailableShares);
            log.info(ns, `[${riser}] current shares: ${ns.formatNumber(longs, 0)}`);
            log.info(ns, `[${riser}] max available shares: ${ns.formatNumber(maxAvailableShares, 0)}`);
            log.info(ns, `[${riser}] shares to buy: ${ns.formatNumber(sharesToBuy, 0)}`);

            let sharesToBuyValue = sharesToBuy * price;
            if(sharesToBuyValue <= 1e6) continue;

            if(dry_run) {
                log.info(ns, `[${riser}] dry-run enabled, would've bought ${ns.formatNumber(sharesToBuy, 0)} for $${ns.formatNumber(sharesToBuyValue, 0)}`);
            }
            else {
                let boughtPrice = ns.stock.buyStock(riser, sharesToBuy);
                if(boughtPrice <= 0) {
                    log.error(ns, `[${riser}] failed to buy shares!`);
                    continue;
                }
                log.info(ns, `[${riser}] bought ${ns.formatNumber(sharesToBuy, 0)}@${ns.formatNumber(boughtPrice, 0)}`);
                funds = Math.max(0, funds - sharesToBuy * boughtPrice);
                log.debug(ns, `funds remaining: $${ns.formatNumber(funds, 0)}`);
            }
        }

        if(!flags["continuous"] as boolean) break;
        else { await ns.stock.nextUpdate(); }
    }

    setTerminal(false);
}