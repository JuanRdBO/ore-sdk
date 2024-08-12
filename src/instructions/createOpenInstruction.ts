import {
	type PublicKey,
	SYSVAR_SLOT_HASHES_PUBKEY,
	SystemProgram,
	TransactionInstruction,
} from "@solana/web3.js";
import { INSTRUCTION_ID_MAP, ORE_PROGRAM_ID, getProofPda } from "../constants";
import { OpenDataLayout } from "../dataLayouts";

type Props = {
	signer: PublicKey;
	miner: PublicKey;
	payer: PublicKey;
};

/**
 * Creates a TransactionInstruction for opening a proof account.
 * This is used to open a proof/mining account for the ORE program.
 *
 * @param payload - The input parameters for creating the instruction.
 * @param payload.signer - The public key of the signer.
 * @param payload.miner - The public key of the miner.
 * @param payload.payer - The public key of the payer.
 * @returns A TransactionInstruction for opening a proof account.
 */
export function createOpenInstruction(payload: Props): TransactionInstruction {
	const { signer, miner, payer } = payload;
	const [proofAccount, proofAccountBump] = getProofPda(signer);

	const keys = [
		{ pubkey: signer, isSigner: true, isWritable: true },
		{ pubkey: miner, isSigner: true, isWritable: true },
		{ pubkey: payer, isSigner: true, isWritable: false },
		{ pubkey: proofAccount, isSigner: false, isWritable: true },
		{ pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
		{ pubkey: SYSVAR_SLOT_HASHES_PUBKEY, isSigner: false, isWritable: false },
	];

	const programInstructionId = INSTRUCTION_ID_MAP.open;
	const instructionId = Buffer.from([programInstructionId]);
	const amountBytes = Buffer.alloc(OpenDataLayout.span);
	amountBytes.writeUInt8(proofAccountBump);
	const data = Buffer.concat([instructionId, amountBytes]);

	return new TransactionInstruction({
		keys,
		programId: ORE_PROGRAM_ID,
		data,
	});
}
