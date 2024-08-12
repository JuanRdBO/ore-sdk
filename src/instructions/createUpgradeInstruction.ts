import { type PublicKey, TransactionInstruction } from "@solana/web3.js";
import {
	INSTRUCTION_ID_MAP,
	ORE_PROGRAM_ID,
	ORE_TOKEN_MINT,
	ORE_TOKEN_MINT_V1,
	TREASURY_PDA,
	TREASURY_TOKENS,
	getProofPda,
} from "../constants";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { ClaimDataLayout } from "../dataLayouts";

type Props = {
	signer: PublicKey;
	beneficiary: PublicKey;
	sender: PublicKey;
	amount: bigint;
};

/**
 * Creates an upgrade instruction for the ORE program.
 * This is used to upgrade the ORE token mint from V1 to V2.
 *
 * @param {Object} params - The parameters for creating the upgrade instruction.
 * @param {PublicKey} params.signer - The public key of the signer.
 * @param {PublicKey} params.sender - The public key of the sender.
 * @param {bigint} params.amount - The amount to stake.
 * @returns {TransactionInstruction} The created upgrade instruction.
 */
export function createUpgradeInstruction({
	signer,
	beneficiary,
	sender,
	amount,
}: Props): TransactionInstruction {
	const keys = [
		{ pubkey: signer, isSigner: true, isWritable: true },
		{ pubkey: beneficiary, isSigner: false, isWritable: true },
		{ pubkey: ORE_TOKEN_MINT, isSigner: false, isWritable: true },
		{ pubkey: ORE_TOKEN_MINT_V1, isSigner: false, isWritable: true },
		{ pubkey: sender, isSigner: false, isWritable: true },
		{ pubkey: TREASURY_PDA, isSigner: false, isWritable: true },
		{ pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
	];

	const programInstructionId = INSTRUCTION_ID_MAP.upgrade;
	const instructionId = Buffer.from([programInstructionId]);
	const amountBytes = Buffer.alloc(ClaimDataLayout.span);
	amountBytes.writeBigUInt64LE(BigInt(amount));

	const instructionData = Buffer.concat([instructionId, amountBytes]);
	return new TransactionInstruction({
		keys,
		programId: ORE_PROGRAM_ID,
		data: instructionData,
	});
}
