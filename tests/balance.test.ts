import { beforeAll, describe, expect, test } from "bun:test";
import { OreSdk } from "../src/OreSdk";
import { PublicKey } from "@solana/web3.js";
import { oreBalanceToNumber } from "../src/utils/numbers";

describe("Balance", () => {
	let rpcUrl: string;
	let minerPublicKey: string;
	let oreSdk: OreSdk;

	beforeAll(() => {
		if (!process.env.RPC_URL) throw new Error("RPC_URL is not set");
		if (!process.env.MINER_PUBLICKEY)
			throw new Error("MINER_PUBLICKEY is not set");

		rpcUrl = process.env.RPC_URL;
		minerPublicKey = process.env.MINER_PUBLICKEY;

		oreSdk = new OreSdk({
			endpoint: process.env.RPC_URL,
			authorityPublicKey: new PublicKey(process.env.MINER_PUBLICKEY),
		});
	});

	test("Get Balance", async () => {
		const [proof, tokenBalance] = await Promise.all([
			oreSdk.getProof(),
			oreSdk.getTokenAccountBalance(),
		]);
		const balances = {
			staked: oreBalanceToNumber(proof?.balance ?? 0n),
			token_v2: oreBalanceToNumber(tokenBalance?.balance ?? 0n),
			token_v1: oreBalanceToNumber(tokenBalance?.balance_v1 ?? 0n),
		};
		console.log(balances);
		expect(balances).toHaveProperty("staked");
		expect(balances).toHaveProperty("token_v2");
		expect(balances).toHaveProperty("token_v1");
	});
});
