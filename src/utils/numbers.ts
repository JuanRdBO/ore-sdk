import { ORE_DECIMALS } from "../constants";

/**
 * Converts a bigint ORE balance to a number.
 * @param balance - The ORE balance as a bigint.
 * @returns The balance as a number, divided by 10^11 to adjust for decimals.
 */
export function oreBalanceToNumber(balance: bigint) {
	return Number(balance) / 10 ** ORE_DECIMALS;
}

/**
 * Converts a number to a bigint ORE balance.
 * @param balance - The balance as a number.
 * @returns The ORE balance as a bigint, multiplied by 10^11 to adjust for decimals.
 */
export function numberToOreBalance(balance: number) {
	return BigInt(balance * 10 ** ORE_DECIMALS);
}
