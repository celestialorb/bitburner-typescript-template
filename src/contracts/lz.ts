// Compression II: LZ Decompression
// You are attempting to solve a Coding Contract. You have 10 tries remaining, after which the contract will self-destruct.


// Lempel-Ziv (LZ) compression is a data compression technique which encodes data using references to earlier parts of the data. In this variant of LZ, data is encoded in two types of chunk.
// Each chunk begins with a length L, encoded as a single ASCII digit from 1 to 9, followed by the chunk data, which is either:
// 1. Exactly L characters, which are to be copied directly into the uncompressed data.
// 2. A reference to an earlier part of the uncompressed data. To do this, the length is followed by a second ASCII digit X: each of the L output characters is a copy of the character X places before it in the uncompressed data.

// For both chunk types, a length of 0 instead means the chunk ends immediately, and the next character is the start of a new chunk. The two chunk types alternate, starting with type 1, and the final chunk may be of either type.

// You are given the following LZ-encoded string:
//     4z4Mf1284azA6s6A691e439zA6v68JKK781g575Wkcoz743qdM6271essUfD432O1
// Decode it and output the original string.

// Example: decoding '5aaabb450723abb' chunk-by-chunk

//     5aaabb           ->  aaabb
//     5aaabb45         ->  aaabbaaab
//     5aaabb450        ->  aaabbaaab
//     5aaabb45072      ->  aaabbaaababababa
//     5aaabb450723abb  ->  aaabbaaababababaabb


// If your solution is an empty string, you must leave the text box empty. Do not use "", '', or ``.

import { NS } from "@ns";

/**
 * Returns the decoded string.
 * 
 * @param data The LZ-encoded data string.
 * @returns The decoded data string.
 */
function decode(data: string): string {
    let decoded = "";
    let pointer = 0;
    while(pointer < data.length) {
        // Grab the next chunk.
        const chunk = data.substring(pointer, data.length);

        // Grab the length of the chunk.
        let length = parseInt(chunk[0]);

        // Increment our pointer to the next character.
        pointer += 1;

        // If we encounter a zero-length chunk, move to the next chunk.
        if(length <= 0) continue;

        // Determine the type of chunk.
        let offset = chunk.charCodeAt(1) - 48;

        // If the second character is a digit, then we have the second type of chunk.
        if(0 <= offset && offset <= 9) {
            let start = decoded.length - offset;
            let end = start + length;
            let data = decoded.substring(start, end);
            while(length > 0) {
                if(length >= data.length) {
                    decoded += data;
                    length -= data.length;
                } else {
                    decoded += data.substring(0, length);
                    length = 0;
                }
            }
            pointer += 1;
        }

        // Otherwise, we can simply copy these characters into our decoded string.
        else {
            decoded += chunk.substring(1, 1 + length);

            // Increment our pointer appropriately.
            pointer += length;
        }
    }
    return decoded;
}

export async function main(ns: NS): Promise<void> {
    ns.tprintf(`solution: ${decode("4z4Mf1284azA6s6A691e439zA6v68JKK781g575Wkcoz743qdM6271essUfD432O1")}`);
}