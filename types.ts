import type { Chain } from "viem";

export interface ChainData {
  [key: string]: Chain;
}

export interface PositionData {
  tag:
    | "InFairLaunch"
    | "FairLaunchETHOnly"
    | "FairLaunchCoinOnly"
    | "BidWall"
    | "PendingBidWall"
    | "ETHAtCurrentTick";
  tickLower: number;
  tickUpper: number;
  ethBalance: bigint;
  coinBalance: bigint;
}

export interface TickData {
  tag: string;
  startTick: number;
  endTick: number;
  ethEquivalentPerTick: number;
}
