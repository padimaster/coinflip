const FAUCET_CONTRACT_ADDRESSES = {
  local: process.env.NEXT_PUBLIC_FLIP_TO_EARN_FAUCET_CONTRACT_ADDRESS_LOCAL,
  baseSepolia:
    process.env.NEXT_PUBLIC_FLIP_TO_EARN_FAUCET_CONTRACT_ADDRESS_BASE_SEPOLIA,
  base: process.env
    .NEXT_PUBLIC_FLIP_TO_EARN_FAUCET_CONTRACT_ADDRESS_BASE_MAINNET,
} as const;

export const getFlipToEarnFaucetContractAddress = (chainId?: number) => {
  console.log("chainId", chainId);
  if (chainId === 84532) {
    return FAUCET_CONTRACT_ADDRESSES.baseSepolia;
  }

  if (chainId === 8453) {
    return FAUCET_CONTRACT_ADDRESSES.base;
  }

  if (chainId === 31337) {
    return FAUCET_CONTRACT_ADDRESSES.local;
  }

  return FAUCET_CONTRACT_ADDRESSES.baseSepolia;
};
