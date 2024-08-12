import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";

export const ORE_PROGRAM_ID = new PublicKey(
	"oreV2ZymfyeXgNgBdqMkumTqqAprVqgBWQfoYkrtKWQ",
);
export const ORE_TOKEN_MINT = new PublicKey(
	"oreoU2P8bN6jkk3jbaiVxYnG1dCXcYxwhwyK9jSybcp",
);
export const ORE_TOKEN_MINT_V1 = new PublicKey(
	"oreoN2tQbHXVaZsr3pf66A48miqcBXCDJozganhEJgz",
);
export const ORE_DECIMALS = 11;
export const MPL_TOKEN_METADATA_PROGRAM_ID = new PublicKey(
	"metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
);

export const EPOCH_DURATION = 60n;

export const MINT_NOISE = new Uint8Array([
	89, 157, 88, 232, 243, 249, 197, 132, 199, 49, 19, 234, 91, 94, 150, 41,
]);

export const [TREASURY_PDA, TREASURY_PDA_BUS] =
	PublicKey.findProgramAddressSync(
		[Buffer.from("treasury")],
		new PublicKey(ORE_PROGRAM_ID),
	);

export const [MINT_PDA, MINT_PDA_BUS] = PublicKey.findProgramAddressSync(
	[Buffer.from("mint"), MINT_NOISE],
	new PublicKey(ORE_PROGRAM_ID),
);

export const [CONFIG_PDA, CONFIG_PDA_BUS] = PublicKey.findProgramAddressSync(
	[Buffer.from("config")],
	new PublicKey(ORE_PROGRAM_ID),
);

export const TREASURY_TOKENS = getAssociatedTokenAddressSync(
	MINT_PDA,
	TREASURY_PDA,
	true,
);

export const [METADATA_PDA, METADATA_PDA_BUS] =
	PublicKey.findProgramAddressSync(
		[
			Buffer.from("metadata"),
			MPL_TOKEN_METADATA_PROGRAM_ID.toBuffer(),
			MINT_PDA.toBuffer(),
		],
		new PublicKey(ORE_PROGRAM_ID),
	);

export const getProofPda = (signer: PublicKey): [PublicKey, number] =>
	PublicKey.findProgramAddressSync(
		[Buffer.from("proof"), signer.toBuffer()],
		new PublicKey(ORE_PROGRAM_ID),
	);

export const getBusAddresses = (count: number): [PublicKey, number][] =>
	Array.from({ length: count }).map((_, i) =>
		PublicKey.findProgramAddressSync(
			[Buffer.from("bus"), Buffer.from([i])],
			new PublicKey(ORE_PROGRAM_ID),
		),
	);

export const INSTRUCTION_ID_MAP = {
	claim: 0,
	close: 1,
	mine: 2,
	open: 3,
	reset: 4,
	stake: 5,
	update: 6,
	upgrade: 7,
	initialize: 100,
} as const;
