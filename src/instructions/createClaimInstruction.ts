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
	beneficiary: PublicKey;
	amount: bigint;
};

/**
 * Creates a claim instruction for the ORE program.
 * This is used to claim the staked ORE in the mining account.
 *
 * @param {Object} params - The parameters for creating the claim instruction.
 * @param {PublicKey} params.signer - The public key of the signer.
 * @param {PublicKey} params.beneficiary - The public key of the beneficiary.
 * @param {bigint} params.amount - The amount to claim.
 * @returns {TransactionInstruction} The created claim instruction.
 */
export function createClaimInstruction({ signer, beneficiary, amount }: Props) {
	const [proofAccount, _] = getProofPda(signer);
	const keys = [
		{ pubkey: signer, isSigner: true, isWritable: true },
		{ pubkey: beneficiary, isSigner: false, isWritable: true },
		{ pubkey: proofAccount, isSigner: false, isWritable: true },
		{ pubkey: TREASURY_PDA, isSigner: false, isWritable: false },
		{ pubkey: TREASURY_TOKENS, isSigner: false, isWritable: true },
		{ pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
	];

	const programInstructionId = INSTRUCTION_ID_MAP.claim;
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
