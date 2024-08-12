import { beforeAll, describe, expect, test } from "bun:test";
import { OreSdk } from "../src";
import { PublicKey } from "@solana/web3.js";

describe("Config", () => {
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

	test("Get Config", async () => {
		const config = await oreSdk.getConfig();
		console.log(config);
		expect(config).toBeDefined();
	});
});
