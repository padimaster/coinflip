import { FAUCET_CONTRACT_ADDRESSES } from "@/contracts/coin-flip.contract";

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
