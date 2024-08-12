import {
	type PublicKey,
	SYSVAR_RENT_PUBKEY,
	SystemProgram,
	TransactionInstruction,
} from "@solana/web3.js";
import {
	CONFIG_PDA,
	CONFIG_PDA_BUS,
	INSTRUCTION_ID_MAP,
	METADATA_PDA,
	METADATA_PDA_BUS,
	MINT_PDA,
	MINT_PDA_BUS,
	MPL_TOKEN_METADATA_PROGRAM_ID,
	ORE_PROGRAM_ID,
	TREASURY_PDA,
	TREASURY_PDA_BUS,
	TREASURY_TOKENS,
	getBusAddresses,
} from "../constants";
import {
	ASSOCIATED_TOKEN_PROGRAM_ID,
	TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

/**
 * Creates an initialize instruction for the ORE program.
 * This is used to initialize a new ORE program.
 *
 * @param authority - The public key of the authority that will sign the transaction.
 * @returns A TransactionInstruction object for initializing the ORE program.
 */
export function createInitializeInstruction(authority: PublicKey) {
	const busPDAs: [PublicKey, number][] = getBusAddresses(8);

	const keys = [
		{ pubkey: authority, isSigner: true, isWritable: true },
		{ pubkey: busPDAs[0][0], isSigner: false, isWritable: false },
		{ pubkey: busPDAs[1][0], isSigner: false, isWritable: false },
		{ pubkey: busPDAs[2][0], isSigner: false, isWritable: false },
		{ pubkey: busPDAs[3][0], isSigner: false, isWritable: false },
		{ pubkey: busPDAs[4][0], isSigner: false, isWritable: false },
		{ pubkey: busPDAs[5][0], isSigner: false, isWritable: false },
		{ pubkey: busPDAs[6][0], isSigner: false, isWritable: false },
		{ pubkey: busPDAs[7][0], isSigner: false, isWritable: false },
		{ pubkey: CONFIG_PDA, isSigner: false, isWritable: false },
		{ pubkey: METADATA_PDA, isSigner: false, isWritable: false },
		{ pubkey: MINT_PDA, isSigner: false, isWritable: false },
		{ pubkey: TREASURY_PDA, isSigner: false, isWritable: false },
		{ pubkey: TREASURY_TOKENS, isSigner: false, isWritable: false },
		{ pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
		{ pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
		{ pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
		{
			pubkey: MPL_TOKEN_METADATA_PROGRAM_ID,
			isSigner: false,
			isWritable: false,
		},
		{ pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
	];

	const programInstructionId = INSTRUCTION_ID_MAP.initialize;
	const instructionId = Buffer.from([programInstructionId]);
	const data = Buffer.concat([
		instructionId,
		Buffer.from([
			busPDAs[0][1],
			busPDAs[1][1],
			busPDAs[2][1],
			busPDAs[3][1],
			busPDAs[4][1],
			busPDAs[5][1],
			busPDAs[6][1],
			busPDAs[7][1],
			CONFIG_PDA_BUS,
			METADATA_PDA_BUS,
			MINT_PDA_BUS,
			TREASURY_PDA_BUS,
		]),
	]);

	return new TransactionInstruction({
		keys,
		programId: ORE_PROGRAM_ID,
		data,
	});
}
