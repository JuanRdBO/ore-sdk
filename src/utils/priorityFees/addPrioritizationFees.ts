import {
	ComputeBudgetProgram,
	type Connection,
	type Transaction,
} from "@solana/web3.js";
import { getPriorityFeeEstimate } from "./getPriorityFeeEstimate";
import { getSimulationComputeUnits } from "./getSimulationComputeUnits";

/**
 * Adds prioritization fees to a Solana transaction.
 *
 * This function estimates and adds compute unit price and limit instructions
 * to the given transaction to optimize its execution priority on the network.
 *
 * @param transaction - The Solana transaction to add prioritization fees to.
 * @param connection - The Solana network connection.
 * @returns A Promise that resolves to the updated Transaction with prioritization fees added.
 * @throws {Error} If the transaction fee payer is not set.
 */
export async function addPrioritizationFees(
	transaction: Transaction,
	connection: Connection,
): Promise<Transaction> {
	if (!transaction.feePayer)
		throw new Error("Transaction fee payer is required");

	if (hasComputeUnitsInstruction(transaction)) return transaction;

	const [recentPrioritizationFees, computeUnits] = await Promise.all([
		getPriorityFeeEstimate(transaction, connection),
		getSimulationComputeUnits({
			transaction,
			feePayerPublicKey: transaction.feePayer,
			connection,
		}),
	]);

	const microLamports = Math.round(
		recentPrioritizationFees > 0 ? recentPrioritizationFees : 10,
	);
	const computePriceIx = ComputeBudgetProgram.setComputeUnitPrice({
		microLamports,
	});
	const computeUnitsIx = computeUnits
		? ComputeBudgetProgram.setComputeUnitLimit({
				units: computeUnits * 1.3, // setting 1.3 multiplier so that we ensure enough CU
			})
		: null;

	// Prepend instructions if they exist
	if (computeUnitsIx) transaction.instructions.unshift(computeUnitsIx); // Ensures it's the first instruction
	if (computePriceIx) transaction.instructions.unshift(computePriceIx); // Ensures it's the second instruction if computeUnitsIx was added, otherwise first

	return transaction;
}

/**
 * Checks if the transaction already has a compute units instruction.
 *
 * @param transaction - The transaction to check for compute units instructions.
 * @returns True if the transaction contains a compute units instruction, false otherwise.
 */
function hasComputeUnitsInstruction(transaction: Transaction): boolean {
	return transaction.instructions.some((instruction) =>
		instruction.programId.equals(ComputeBudgetProgram.programId),
	);
}
