import { FAUCET_CONTRACT_ADDRESSES } from "@/contracts/coin-flip.contract";

export const getFlipToEarnFaucetContractAddress = (chainId?: number) => {
  if (chainId === 84532) {
    return FAUCET_CONTRACT_ADDRESSES.baseSepolia;
  }

  if (chainId === 8453) {
    return FAUCET_CONTRACT_ADDRESSES.base;
  }

  return FAUCET_CONTRACT_ADDRESSES.baseSepolia;
};
