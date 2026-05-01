// This command finds the optimal infiltration locations.

import { NS, InfiltrationLocation } from "@ns";

export async function main(ns: NS): Promise<void> {
    const locations = ns.infiltration.getPossibleLocations();
    let infiltrationLocations = [];
    for(const location of locations) {
        const infiltration = ns.infiltration.getInfiltration(location.name);
        // const ratio = infiltration.reward.tradeRep / infiltration.maxClearanceLevel;
        infiltrationLocations.push(infiltration);
    }
    infiltrationLocations.sort((a: InfiltrationLocation, b: InfiltrationLocation) => {
        return a.maxClearanceLevel - b.maxClearanceLevel;
        // const ratioA = a.reward.tradeRep / a.maxClearanceLevel;
        // const ratioB = b.reward.tradeRep / b.maxClearanceLevel;
        // return ratioB - ratioA;
    })
    infiltrationLocations = infiltrationLocations.reverse();

    for(const location of infiltrationLocations) {
        ns.tprintf(`location: ${location?.location.name}@${location?.location.city}, ratio: ${location?.reward.tradeRep}, max levels: ${location?.maxClearanceLevel}`);    
    }
}