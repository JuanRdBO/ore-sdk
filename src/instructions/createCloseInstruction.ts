import {
	type PublicKey,
	SystemProgram,
	TransactionInstruction,
} from "@solana/web3.js";
import { INSTRUCTION_ID_MAP, ORE_PROGRAM_ID, getProofPda } from "../constants";
import { OpenDataLayout } from "../dataLayouts";

/**
 * Creates a close instruction for the ORE program.
 * This is used to close your mining account from the ORE program.
 *
 * @param signer - The public key of the signer who will close the proof account.
 * @returns A TransactionInstruction object for closing the proof account.
 */
export function creatCloseInstruction(
	signer: PublicKey,
): TransactionInstruction {
	const [proofAccount, proofAccountBump] = getProofPda(signer);

	const keys = [
		{ pubkey: signer, isSigner: true, isWritable: true },
		{ pubkey: proofAccount, isSigner: false, isWritable: true },
		{ pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
	];

	const programInstructionId = INSTRUCTION_ID_MAP.close;
	const data = Buffer.from([programInstructionId]);

	return new TransactionInstruction({
		keys,
		programId: ORE_PROGRAM_ID,
		data,
	});
}
