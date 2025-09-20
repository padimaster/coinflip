import { createWalletClient, http } from "viem";
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
