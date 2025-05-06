import { ChainData } from "@/types";
import { anvil, baseSepolia, base, Chain } from "viem/chains";

export const anvilBaseSepolia: Chain = {
  ...anvil,
  blockExplorers: baseSepolia.blockExplorers,
};

export const chains: ChainData = {
  "base-sepolia": baseSepolia,
  base: base,
  anvil: anvilBaseSepolia,
};

export const chainIdToBlockDelayInSeconds: {
  [key: string]: number;
} = {
  [baseSepolia.id]: 2,
  [base.id]: 2,
};

export const chainIdToRpcUrl: {
  [key: string]: string;
} = {
  [baseSepolia.id]:
    process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL ??
    baseSepolia.rpcUrls.default.http[0],
  [base.id]:
    process.env.NEXT_PUBLIC_BASE_RPC_URL ?? base.rpcUrls.default.http[0],
};
