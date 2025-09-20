import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base, baseSepolia } from "viem/chains";
import { customFoundryNetwork } from "./web.config";

const privateKey = process.env.PRIVATE_KEY;

const account = privateKeyToAccount(privateKey as `0x${string}`);

export const baseClient = createWalletClient({
  account,
  chain: base,
  transport: http(),
});

export const baseSepoliaClient = createWalletClient({
  account,
  chain: baseSepolia,
  transport: http(),
});

export const localClient = createWalletClient({
  account,
  chain: customFoundryNetwork,
  transport: http(),
});

// Public clients for reading from contracts
export const basePublicClient = createPublicClient({
  chain: base,
  transport: http(),
});

export const baseSepoliaPublicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

export const localPublicClient = createPublicClient({
  chain: customFoundryNetwork,
  transport: http(),
});

// Reusable function to get wallet client based on chain ID
export const getWalletClient = (chainId: number) => {
  if (chainId === 8453) {
    return baseClient;
  } else if (chainId === 84532) {
    return baseSepoliaClient;
  } else {
    return localClient; // Default to local for other chains (like 31337)
  }
};

// Reusable function to get public client based on chain ID
export const getPublicClient = (chainId: number) => {
  if (chainId === 8453) {
    return basePublicClient;
  } else if (chainId === 84532) {
    return baseSepoliaPublicClient;
  } else {
    return localPublicClient; // Default to local for other chains (like 31337)
  }
};
