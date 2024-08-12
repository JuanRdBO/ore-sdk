import { type PublicKey, TransactionInstruction } from "@solana/web3.js";
import {
	INSTRUCTION_ID_MAP,
	ORE_PROGRAM_ID,
	TREASURY_PDA,
	TREASURY_TOKENS,
	getProofPda,
} from "../constants";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { ClaimDataLayout } from "../dataLayouts";

type Props = {
	signer: PublicKey;
	sender: PublicKey;
	amount: bigint;
};

/**
 * Creates a stake instruction for the ORE program.
 * This is used to stake ORE in the mining account.
 *
 * @param {Object} params - The parameters for creating the stake instruction.
 * @param {PublicKey} params.signer - The public key of the signer.
 * @param {PublicKey} params.sender - The public key of the sender.
 * @param {bigint} params.amount - The amount to stake.
 * @returns {TransactionInstruction} The created stake instruction.
 */
export function createStakeInstruction({
	signer,
	sender,
	amount,
}: Props): TransactionInstruction {
	const [proofAccount, _] = getProofPda(signer);

	const keys = [
		{ pubkey: signer, isSigner: true, isWritable: true },
		{ pubkey: proofAccount, isSigner: false, isWritable: true },
		{ pubkey: sender, isSigner: false, isWritable: true },
		{ pubkey: TREASURY_TOKENS, isSigner: false, isWritable: true },
		{ pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
	];

	const programInstructionId = INSTRUCTION_ID_MAP.stake;
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
