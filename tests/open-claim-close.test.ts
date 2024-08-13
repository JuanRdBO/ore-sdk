import { beforeAll, describe, expect, test } from "bun:test";
import { OreSdk } from "../src/OreSdk";
import { Keypair, LAMPORTS_PER_SOL, type PublicKey } from "@solana/web3.js";
import { sendTransaction } from "../src/utils/sendAndConfirmTransaction";
import { addPrioritizationFees } from "../src/utils/priorityFees/addPrioritizationFees";
import { getProofPda } from "../src/constants";
import { oreBalanceToNumber } from "../src/utils/numbers";

const TIMEOUT = 90000;

describe("Open", () => {
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
		"Claim - close - open - stake flow",
		async () => {
			const connection = oreSdk.getConnection();
			const minerData = await oreSdk.getProof();
			if (minerData) {
				// Claim all the ORE, if any
				if (minerData.balance > 0n) {
					const claimTransaction = await oreSdk.getClaimTransaction();
					expect(claimTransaction).toBeDefined();
					const connection = oreSdk.getConnection();
					const claimTxWithPrioFees = await addPrioritizationFees(
						claimTransaction,
						connection,
					);
					console.log("sending claim transaction...");
					const claimRes = await sendTransaction(
						claimTxWithPrioFees,
						connection,
						[minerKeypair],
					);
					console.log("claim transaction sent", claimRes);
					expect(claimRes).toBeDefined();
				}

				// Close the mining account
				const closeTransaction = await oreSdk.getCloseTransaction();
				if (!closeTransaction) throw new Error("Transaction is expected");
				expect(closeTransaction).toBeDefined();
				const txWithPrioFees = await addPrioritizationFees(
					closeTransaction,
					connection,
				);
				console.log("sending close transaction...");
				const closeRes = await sendTransaction(txWithPrioFees, connection, [
					minerKeypair,
				]);
				console.log("close transaction sent", closeRes);
				expect(closeRes).toBeDefined();
			}

			// Expect the miner data to be null at the beginning of the test
			const newMinerData = await oreSdk.getProof();
			expect(newMinerData).toBeNull();

			// Open the account again
			const openTransaction = await oreSdk.getOpenTransaction();
			if (!openTransaction) throw new Error("Transaction is expected");
			expect(openTransaction).toBeDefined();
			const openTxWithPrioFees = await addPrioritizationFees(
				openTransaction,
				connection,
			);
			console.log("sending open transaction...");
			const openRes = await sendTransaction(openTxWithPrioFees, connection, [
				minerKeypair,
			]);
			console.log("open transaction sent", openRes);
			expect(openRes).toBeDefined();

			const tokenBalance = await oreSdk.getTokenAccountBalance();
			expect(tokenBalance.balance).toBeDefined();

			// Stake all ore tokens
			const stakeTransaction = await oreSdk.getStakeTransaction();
			if (!stakeTransaction) throw new Error("Transaction is expected");
			expect(stakeTransaction).toBeDefined();
			const stakeTxWithPrioFees = await addPrioritizationFees(
				stakeTransaction,
				connection,
			);
			console.log("sending stake transaction...");
			const stakeRes = await sendTransaction(stakeTxWithPrioFees, connection, [
				minerKeypair,
			]);
			console.log("stake transaction sent", stakeRes);
			expect(stakeRes).toBeDefined();

			// Expect the new miner data to reflect the staking changes
			const stakedMinerData = await oreSdk.getProof();
			expect(stakedMinerData).toBeDefined();
			expect(stakedMinerData?.balance).toEqual(tokenBalance.balance);
		},
		TIMEOUT,
	);
});
