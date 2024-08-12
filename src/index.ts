import {
	Connection,
	type PublicKey,
	Transaction,
	type TransactionInstruction,
	SYSVAR_CLOCK_PUBKEY,
} from "@solana/web3.js";
import {
	BusDataLayout,
	ClockDataLayout,
	ConfigDataLayout,
	ProofDataLayout,
} from "./dataLayouts";
import {
	TOKEN_PROGRAM_ID,
	createAssociatedTokenAccountInstruction,
	getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
	CONFIG_PDA,
	EPOCH_DURATION,
	MINT_PDA,
	ORE_TOKEN_MINT,
	ORE_TOKEN_MINT_V1,
	TREASURY_PDA,
	getBusAddresses,
	getProofPda,
} from "./constants";
import { createClaimInstruction } from "./instructions/createClaimInstruction";
import { createInitializeInstruction } from "./instructions/createInitializeInstruction";
import { createOpenInstruction } from "./instructions/createOpenInstruction";
import type { BusData, ClockData, ConfigData, ProofData } from "./dataLayouts";
import { oreBalanceToNumber } from "./utils/numbers";
import { creatCloseInstruction } from "./instructions/createCloseInstruction";
import { createStakeInstruction } from "./instructions/createStakeInstruction";
import { createUpgradeInstruction } from "./instructions/createUpgradeInstruction";

export class OreSdk {
	private readonly authorityPublicKey: PublicKey;
	private readonly endpoint: string;

	constructor(payload: {
		authorityPublicKey: PublicKey;
		endpoint: string;
	}) {
		this.authorityPublicKey = payload.authorityPublicKey;
		this.endpoint = payload.endpoint;
	}

	/**
	 * Creates and returns a new Connection instance using the endpoint specified in the constructor.
	 * @returns {Connection} A new Connection instance.
	 */
	getConnection(): Connection {
		return new Connection(this.endpoint);
	}

	/**
	 * Retrieves the proof data for the current authority.
	 * @returns {Promise<ProofData | null>} The decoded proof data, or null if not found.
	 * @throws {Error} If authority public key or authority is not set.
	 */
	async getProof(): Promise<ProofData | null> {
		const connection = this.getConnection();
		const [ata, _] = getProofPda(this.authorityPublicKey);
		const accountData = await connection.getAccountInfo(ata);
		if (!accountData?.data) return null;
		return ProofDataLayout.decode(accountData.data);
	}

	/**
	 * Retrieves the data for all bus addresses.
	 * @returns {Promise<Array<{address: string, [key: string]: any}>>} An array of objects containing the address and decoded bus data for each bus.
	 * @throws {Error} If a bus account is not found.
	 */
	async getBusData(): Promise<BusData[]> {
		const connection = this.getConnection();
		const busAddresses = getBusAddresses(8).map(([address, _]) => address);
		const busDataPromises = busAddresses.map(async (address) => {
			const accountInfo = await connection.getAccountInfo(address);
			if (!accountInfo)
				throw new Error(`Bus account ${address.toBase58()} not found`);
			const busData = BusDataLayout.decode(accountInfo.data);
			return { address: address.toBase58(), ...busData };
		});
		return Promise.all(busDataPromises);
	}

	/**
	 * Calculates and returns the reward rates for different difficulty levels.
	 * @returns {Promise<Array<{difficulty: number, reward: number}>>} An array of objects containing difficulty levels and their corresponding rewards.
	 * @throws {Error} If the config is not found.
	 */
	async getRewards(): Promise<{ difficulty: number; reward: number }[]> {
		const config = await this.getConfig();
		if (!config) throw new Error("Config not found");
		const rewards: { difficulty: number; reward: number }[] = [];
		for (let i = 0; i < 32; i++) {
			const difficulty = BigInt(config.minDifficulty) + BigInt(i);
			const rewardRate = config.baseRewardRate * BigInt(2) ** BigInt(i);
			rewards.push({
				difficulty: Number(difficulty),
				reward: oreBalanceToNumber(rewardRate),
			});
		}
		return rewards;
	}

	/**
	 * Retrieves the configuration data for the ORE program.
	 * @returns {Promise<ConfigData | null>} A promise that resolves to the decoded ConfigData, or null if the account doesn't exist.
	 */
	async getConfig(): Promise<ConfigData | null> {
		const connection = this.getConnection();
		const accountData = await connection.getAccountInfo(CONFIG_PDA);
		if (!accountData) return null;
		return ConfigDataLayout.decode(accountData.data);
	}

	/**
	 * Retrieves the current Solana clock data.
	 * @returns {Promise<ClockData>} A promise that resolves to the decoded ClockData.
	 * @throws {Error} If the clock account data cannot be retrieved or decoded.
	 */
	async getClock(): Promise<ClockData> {
		const connection = this.getConnection();
		const clockSysvarAccount =
			await connection.getAccountInfo(SYSVAR_CLOCK_PUBKEY);
		if (!clockSysvarAccount || !clockSysvarAccount.data)
			throw new Error("Failed to get clock account data");
		return ClockDataLayout.decode(clockSysvarAccount.data);
	}

	/**
	 * Determines if a reset should occur based on the current time and the last reset time.
	 * @param {ConfigData} config - The current configuration data.
	 * @returns {Promise<boolean>} A promise that resolves to true if a reset should occur, false otherwise.
	 */
	async shouldReset(config: ConfigData): Promise<boolean> {
		const clock = await this.getClock();
		const time = config.lastResetAt + EPOCH_DURATION - 5n;
		return time <= clock.unixTimestamp;
	}

	/**
	 * Calculates the cutoff time for submitting a new hash.
	 * @param {ProofData} proof - The current proof data.
	 * @param {bigint} bufferTime - The buffer time to subtract from the cutoff.
	 * @returns {Promise<bigint>} The remaining time until the cutoff, or 0 if the cutoff has passed.
	 */
	async getCutoff(proof: ProofData, bufferTime: bigint): Promise<bigint> {
		const clock = await this.getClock();
		const time = proof.lastHashAt + 60n - bufferTime - clock.unixTimestamp;
		if (time > 0n) return time;
		return 0n;
	}

	/**
	 * Retrieves the ORE v1 and v2 account balances for the authority.
	 * @returns {Promise<{balance: bigint, balance_v1: bigint}>} An object containing the balances for both the current and v1 token accounts.
	 * @throws {Error} If authority public key or authority is not set.
	 */
	async getTokenAccountBalance(): Promise<{
		balance: bigint;
		balance_v1: bigint;
	}> {
		const connection = this.getConnection();
		const ata = getAssociatedTokenAddressSync(
			ORE_TOKEN_MINT,
			this.authorityPublicKey,
		);
		const ata_v1 = getAssociatedTokenAddressSync(
			ORE_TOKEN_MINT_V1,
			this.authorityPublicKey,
		);
		const [balance, balance_v1] = await Promise.all([
			connection
				.getTokenAccountBalance(ata)
				.then((res) => BigInt(res.value.amount))
				.catch(() => 0n),
			connection
				.getTokenAccountBalance(ata_v1)
				.then((res) => BigInt(res.value.amount))
				.catch(() => 0n),
		]);
		return { balance, balance_v1 };
	}

	/**
	 * Generates a transaction for staking ORE tokens.
	 * @param {bigint} [amount] - Optional. The amount of tokens to stake. If not provided, the entire balance will be staked.
	 * @returns {Promise<Transaction>} A Promise that resolves to a Transaction object for staking tokens.
	 * @throws {Error} If the proof is not found or if there's an issue fetching the token account.
	 */
	async getStakeTransaction(amount?: bigint): Promise<Transaction> {
		const connection = this.getConnection();
		const proof = await this.getProof();
		if (!proof) throw new Error("Proof not found");
		const ata = getAssociatedTokenAddressSync(
			MINT_PDA,
			this.authorityPublicKey,
		);
		const ataData = await connection.getAccountInfo(ata);
		if (!ataData) throw new Error("Failed to fetch token account");

		let amountToStake: bigint;
		if (amount) {
			amountToStake = amount;
		} else {
			const balance = await this.getTokenAccountBalance();
			amountToStake = balance.balance;
		}
		const transaction = new Transaction().add(
			createStakeInstruction({
				signer: this.authorityPublicKey,
				sender: ata,
				amount: amountToStake,
			}),
		);
		transaction.feePayer = this.authorityPublicKey;
		transaction.recentBlockhash = (
			await connection.getLatestBlockhash()
		).blockhash;

		return transaction;
	}

	/**
	 * Generates a transaction for upgrading ORE v1 tokens to ORE v2 tokens.
	 * @param {bigint} [amount] - Optional. The amount of ORE v1 tokens to upgrade. If not provided, the entire balance will be upgraded.
	 * @returns {Promise<Transaction>} A Promise that resolves to a Transaction object for upgrading tokens.
	 * @throws {Error} If the proof is not found, there's no ORE v1 token balance, or if there's an issue fetching token accounts.
	 */
	async getUpgradeTransaction(amount?: bigint): Promise<Transaction> {
		const connection = this.getConnection();
		const proof = await this.getProof();
		if (!proof) throw new Error("Proof not found");
		const instructions: TransactionInstruction[] = [];

		const ataV1 = getAssociatedTokenAddressSync(
			ORE_TOKEN_MINT_V1,
			this.authorityPublicKey,
		);
		if (!ataV1) throw new Error("Failed to fetch ORE v1 token account");

		const balances = await this.getTokenAccountBalance();
		const balanceV1 = balances.balance_v1;
		if (!balanceV1) throw new Error("No ORE v1 token balance");
		const amountToUpgrade = amount ?? balanceV1;

		const ata = getAssociatedTokenAddressSync(
			MINT_PDA,
			this.authorityPublicKey,
		);

		const ataData = await connection.getAccountInfo(ata);
		if (!ataData) {
			instructions.push(
				createAssociatedTokenAccountInstruction(
					this.authorityPublicKey,
					ata,
					this.authorityPublicKey,
					MINT_PDA,
					TOKEN_PROGRAM_ID,
				),
			);
		}
		instructions.push(
			createUpgradeInstruction({
				signer: this.authorityPublicKey,
				sender: ataV1,
				beneficiary: ata,
				amount: amountToUpgrade,
			}),
		);

		const transaction = new Transaction().add(...instructions);
		transaction.feePayer = this.authorityPublicKey;
		transaction.recentBlockhash = (
			await connection.getLatestBlockhash()
		).blockhash;

		return transaction;
	}

	/**
	 * Generates a transaction for claiming ORE tokens.
	 * @param {bigint} [amount] - Optional. The amount of tokens to claim. If not provided, the entire balance from the proof will be claimed.
	 * @returns {Promise<Transaction>} A Promise that resolves to a Transaction object for claiming tokens.
	 * @throws {Error} If there's an issue creating the transaction or fetching necessary data.
	 */
	async getClaimTransaction(amount?: bigint): Promise<Transaction> {
		const connection = this.getConnection();
		const proof = await this.getProof();
		if (!proof) throw new Error("Proof not found");
		const instructions: TransactionInstruction[] = [];
		const ata = getAssociatedTokenAddressSync(
			MINT_PDA,
			this.authorityPublicKey,
		);
		const ataData = await connection.getAccountInfo(ata);
		if (!ataData) {
			instructions.push(
				createAssociatedTokenAccountInstruction(
					this.authorityPublicKey,
					ata,
					this.authorityPublicKey,
					MINT_PDA,
					TOKEN_PROGRAM_ID,
				),
			);
		}
		instructions.push(
			createClaimInstruction({
				signer: this.authorityPublicKey,
				beneficiary: ata,
				amount: amount ?? proof?.balance,
			}),
		);
		const transaction = new Transaction().add(...instructions);
		transaction.feePayer = this.authorityPublicKey;
		transaction.recentBlockhash = (
			await connection.getLatestBlockhash()
		).blockhash;

		return transaction;
	}

	/**
	 * Generates a transaction for opening a new proof account.
	 * @returns {Promise<Transaction | null>} A Promise that resolves to a Transaction object for opening a proof account, or null if the account already exists.
	 * @throws {Error} If authority public key or authority is not set.
	 */
	async getOpenTransaction(): Promise<Transaction | null> {
		const connection = this.getConnection();
		const [proofAccount, _] = getProofPda(this.authorityPublicKey);
		const accountData = await connection.getAccountInfo(proofAccount);
		if (accountData) return null;
		const transaction = new Transaction().add(
			createOpenInstruction({
				signer: this.authorityPublicKey,
				miner: this.authorityPublicKey,
				payer: this.authorityPublicKey,
			}),
		);
		transaction.feePayer = this.authorityPublicKey;
		transaction.recentBlockhash = (
			await connection.getLatestBlockhash()
		).blockhash;
		return transaction;
	}

	/**
	 * Generates a transaction for closing the proof account.
	 * @returns {Promise<Transaction | null>} A Promise that resolves to a Transaction object for closing the proof account, or null if the account doesn't exist.
	 * @throws {Error} If there's an issue creating the transaction or fetching necessary data.
	 */
	async getCloseTransaction(): Promise<Transaction | null> {
		const connection = this.getConnection();
		const [proofAccount, _] = getProofPda(this.authorityPublicKey);
		const accountData = await connection.getAccountInfo(proofAccount);
		if (!accountData) return null;
		const transaction = new Transaction().add(
			creatCloseInstruction(this.authorityPublicKey),
		);
		transaction.feePayer = this.authorityPublicKey;
		transaction.recentBlockhash = (
			await connection.getLatestBlockhash()
		).blockhash;
		return transaction;
	}

	/**
	 * Generates a transaction for initializing the ORE program.
	 * @returns {Promise<Transaction | null>} A Promise that resolves to a Transaction object for initializing the program, or null if the program is already initialized.
	 * @throws {Error} If authority public key or authority is not set.
	 */
	async getInitializeTransaction(): Promise<Transaction | null> {
		const connection = this.getConnection();
		const accountData = await connection.getAccountInfo(TREASURY_PDA);
		// Return early if program is already initialized
		if (accountData) return null;
		const transaction = new Transaction().add(
			createInitializeInstruction(this.authorityPublicKey),
		);
		transaction.feePayer = this.authorityPublicKey;
		transaction.recentBlockhash = (
			await connection.getLatestBlockhash()
		).blockhash;

		return transaction;
	}
}
