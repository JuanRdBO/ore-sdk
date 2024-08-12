import { type Connection, PublicKey, type Transaction } from "@solana/web3.js";
import { ORE_PROGRAM_ID } from "../../constants";
import { chunk } from "../misc";

const PROGRAM_PUBKEYS = [
	ORE_PROGRAM_ID,
	new PublicKey("5HngGmYzvSuh3XyU11brHDpMTHXQQRQQT4udGFtQSjgR"),
	new PublicKey("2oLNTQKRb4a2117kFi6BYTUDu3RPrMVAHFhCfPKMosxX"),
];

/**
 * Estimates the priority fee for a Solana transaction.
 *
 * @param transaction - The Solana transaction to estimate the priority fee for.
 * @param connection - The Solana connection object.
 * @param percentile - The percentile to use for the fee estimate (default: 75).
 * @returns A Promise that resolves to the estimated priority fee.
 * @throws Error if no recent prioritization fees are available.
 */
export async function getPriorityFeeEstimate(
	transaction: Transaction,
	connection: Connection,
	percentile = 75,
) {
	const recentPrioritizationFees = await connection.getRecentPrioritizationFees(
		{
			lockedWritableAccounts:
				getProgramIdsFromTransaction(transaction).concat(PROGRAM_PUBKEYS),
		},
	);

	if (recentPrioritizationFees.length === 0)
		throw new Error("No recent prioritization fees");

	const sortedFees = recentPrioritizationFees.sort((a, b) => b.slot - a.slot);
	const chunkSize = 150;
	const chunks = chunk(sortedFees, chunkSize).slice(0, 3);

	let percentiles = new Map<number, number>();
	for (const chunk of chunks) {
		const fees = chunk.map((fee) => fee.prioritizationFee);
		percentiles = calculatePercentiles(fees);
	}

	return percentiles.get(percentile) ?? 0;
}

/**
 * Extracts program IDs from a Solana transaction.
 * @param transaction - The Solana transaction to extract program IDs from.
 * @returns An array of PublicKeys representing the program IDs found in the transaction.
 */
function getProgramIdsFromTransaction(transaction: Transaction): PublicKey[] {
	const programIds: PublicKey[] = [];
	for (const instruction of transaction.instructions) {
		programIds.push(instruction.programId);
	}
	return programIds;
}

/**
 * Calculates percentiles for a given array of fees.
 * @param fees - An array of numbers representing fees.
 * @returns A Map where keys are percentile values and values are the corresponding fee amounts.
 */
function calculatePercentiles(fees: number[]): Map<number, number> {
	const sortedFees = [...fees].sort((a, b) => a - b);
	const len = sortedFees.length;
	const percentiles = [10, 25, 50, 60, 70, 75, 80, 85, 90, 100];

	return new Map(
		percentiles.map((p) => {
			const index = Math.round((p / 100) * len) - 1;
			return [p, sortedFees[Math.max(0, index)] ?? 0];
		}),
	);
}
