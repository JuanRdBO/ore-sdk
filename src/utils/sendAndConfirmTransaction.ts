import {
	type Connection,
	type Signer,
	type Transaction,
	sendAndConfirmTransaction,
} from "@solana/web3.js";

/**
 * Sends and confirms a transaction on the Solana network.
 * @TODO: Implement actual working logic
 *
 * @param transaction - The transaction to be sent and confirmed.
 * @param connection - The connection to the Solana cluster.
 * @param signers - An array of signers required to sign the transaction.
 * @returns A promise that resolves when the transaction is confirmed.
 */
export async function sendTransaction(
	transaction: Transaction,
	connection: Connection,
	signers: Signer[],
) {
	return sendAndConfirmTransaction(connection, transaction, signers);
}
