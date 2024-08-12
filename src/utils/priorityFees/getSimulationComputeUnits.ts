import {
	type AddressLookupTableAccount,
	ComputeBudgetProgram,
	type Connection,
	PublicKey,
	type RpcResponseAndContext,
	type SignatureResult,
	type SimulatedTransactionResponse,
	type Transaction,
	TransactionMessage,
	VersionedTransaction,
} from "@solana/web3.js";

type Props = {
	transaction: Transaction;
	feePayerPublicKey: PublicKey;
	connection: Connection;
	lookupTables?: Array<AddressLookupTableAccount>;
};

/**
 * Simulates a transaction to determine the number of compute units consumed.
 *
 * Credit https://twitter.com/stegabob, originally from https://x.com/stegaBOB/status/1766662289392889920
 *
 * @param {Object} params - The parameters for the simulation.
 * @param {Transaction} params.transaction - The transaction to simulate.
 * @param {PublicKey} params.feePayerPublicKey - The public key of the fee payer.
 * @param {Connection} params.connection - The Solana connection object.
 * @param {Array<AddressLookupTableAccount>} [params.lookupTables=[]] - Optional array of address lookup tables.
 * @returns {Promise<number | null>} The number of compute units consumed, or null if not available.
 * @throws {Error} If there's an error during simulation.
 */
export const getSimulationComputeUnits = async ({
	transaction,
	feePayerPublicKey,
	connection,
	lookupTables = [],
}: Props): Promise<number | null> => {
	const testInstructions = [
		ComputeBudgetProgram.setComputeUnitLimit({ units: 1_400_000 }),
		...transaction.instructions,
	];

	const testTransaction = new VersionedTransaction(
		new TransactionMessage({
			instructions: testInstructions,
			payerKey: feePayerPublicKey,
			recentBlockhash: PublicKey.default.toString(),
		}).compileToV0Message(lookupTables),
	);

	const rpcResponse = await connection.simulateTransaction(testTransaction, {
		replaceRecentBlockhash: true,
		sigVerify: false,
	});

	await getErrorFromRPCResponse(rpcResponse);
	return rpcResponse.value.unitsConsumed || null;
};

const getErrorFromRPCResponse = async (
	rpcResponse: RpcResponseAndContext<
		SignatureResult | SimulatedTransactionResponse
	>,
) => {
	// Note: `confirmTransaction` does not throw an error if the confirmation does not succeed,
	// but rather a `TransactionError` object. so we handle that here
	// See https://solana-labs.github.io/solana-web3.js/classes/Connection.html#confirmTransaction.confirmTransaction-1
	const error = rpcResponse.value.err;
	if (error) {
		if (typeof error === "object") {
			const errorKeys = Object.keys(error);
			if (errorKeys.length === 1) {
				if (errorKeys[0] !== "InstructionError") {
					throw new Error(
						`Unknown RPC error: ${JSON.stringify(error, null, 4)}`,
					);
				}
				// @ts-ignore due to missing typing information mentioned above.
				const instructionError = error.InstructionError;
				// An instruction error is a custom program error and looks like:
				// [
				//   1,
				//   {
				//     "Custom": 1
				//   }
				// ]
				// See also https://solana.stackexchange.com/a/931/294
				throw new Error(
					`Error in transaction: instruction index ${instructionError[0]}, custom program error ${instructionError[1].Custom}`,
				);
			}
		}
		throw Error(error.toString());
	}
};
