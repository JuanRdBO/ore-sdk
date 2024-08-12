import type { PublicKey } from "@solana/web3.js";
import { blob, struct, u8 } from "@solana/buffer-layout";
import { u64, publicKey } from "@solana/buffer-layout-utils";

export const ProofDataLayout = struct<ProofData>([
	u64("accountDiscriminator"),
	publicKey("authority"),
	u64("balance"),
	//@ts-expect-error
	blob(32, "challenge"),
	//@ts-expect-error
	blob(32, "lastHash"),
	u64("lastHashAt"),
	u64("lastStakeAt"),
	publicKey("miner"),
	u64("totalHashes"),
	u64("totalRewards"),
]);
export interface ProofData {
	accountDiscriminator: bigint;
	authority: PublicKey;
	balance: bigint;
	challenge: Buffer;
	lastHash: Buffer;
	lastHashAt: bigint;
	lastStakeAt: bigint;
	miner: PublicKey;
	totalHashes: bigint;
	totalRewards: bigint;
}

export const ClaimDataLayout = struct<ClaimData>([u64("amount")]);
interface ClaimData {
	amount: bigint;
}

export const OpenDataLayout = struct<OpenData>([u8("bump")]);
interface OpenData {
	bump: number;
}

export const ClockDataLayout = struct<ClockData>([
	u64("slot"),
	u64("epochStartTimestamp"),
	u64("epoch"),
	u64("leaderScheduleEpoch"),
	u64("unixTimestamp"),
]);
export interface ClockData {
	slot: bigint;
	epochStartTimestamp: bigint;
	epoch: bigint;
	leaderScheduleEpoch: bigint;
	unixTimestamp: bigint;
}

export const ConfigDataLayout = struct<ConfigData>([
	u64("accountDiscriminator"),
	u64("baseRewardRate"),
	u64("lastResetAt"),
	u64("minDifficulty"),
	u64("topBalance"),
]);
export interface ConfigData {
	accountDiscriminator: bigint;
	baseRewardRate: bigint;
	lastResetAt: bigint;
	minDifficulty: bigint;
	topBalance: bigint;
}

export const BusDataLayout = struct<BusData>([
	u64("accountDiscriminator"),
	u64("id"),
	u64("rewards"),
	u64("theoretical_rewards"),
	u64("top_balance"),
]);
export interface BusData {
	accountDiscriminator: bigint;
	id: bigint;
	rewards: bigint;
	theoretical_rewards: bigint;
	top_balance: bigint;
}
