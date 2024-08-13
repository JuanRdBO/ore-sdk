import { beforeAll, describe, expect, test } from "bun:test";
import { OreSdk } from "../src/OreSdk";
import { Keypair, type PublicKey } from "@solana/web3.js";
import { sendTransaction } from "../src/utils/sendAndConfirmTransaction";
import { addPrioritizationFees } from "../src/utils/priorityFees/addPrioritizationFees";

const TIMEOUT = 60000;

describe("Upgrade", () => {
	let rpcUrl: string;
	let minerPublicKey: PublicKey;
	let minerKeypair: Keypair;
	let oreSdk: OreSdk;

	beforeAll(() => {
		if (!process.env.RPC_URL) throw new Error("RPC_URL is not set");
		if (!process.env.MINER_KEYPAIR) throw new Error("MINER_KEYPAIR is not set");

		rpcUrl = process.env.RPC_URL;
		minerKeypair = Keypair.fromSecretKey(
			new Uint8Array(JSON.parse(process.env.MINER_KEYPAIR)),
		);
		minerPublicKey = minerKeypair.publicKey;

		oreSdk = new OreSdk({
			endpoint: process.env.RPC_URL,
			authorityPublicKey: minerPublicKey,
		});
	});

	test(
		"Get Upgrade Transaction",
		async () => {
			const claimAmount = 1n;
			const transaction = await oreSdk.getUpgradeTransaction(claimAmount);
			expect(transaction).toBeDefined();
			const connection = oreSdk.getConnection();
			const txWithPrioFees = await addPrioritizationFees(
				transaction,
				connection,
			);
			console.log("sending upgrade transaction...");
			const res = await sendTransaction(txWithPrioFees, connection, [
				minerKeypair,
			]);
			console.log("upgrade transaction sent", res);
			expect(res).toBeDefined();
		},
		TIMEOUT,
	);
});
