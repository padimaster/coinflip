import { useChainId, useWriteContract, useAccount } from "wagmi";

import { coinFlipContractAddress, abi } from "@/contracts/coin-flip.contract";

export const getContractAddress = (chainId?: number) => {
  if (chainId === 84532) {
    return coinFlipContractAddress.baseSepolia;
  }

  if (chainId === 8453) {
    return coinFlipContractAddress.base;
  }

  return coinFlipContractAddress.baseSepolia;
};

export const useContract = () => {
  const chainId = useChainId();
  const address = getContractAddress(chainId);

  return {
    address,
    abi,
    chainId,
    isConnected: !!chainId,
  };
};

// Hook to claim reward using wallet client
export const useClaimReward = () => {
  const { address: contractAddress } = useContract();
  const { address: userAddress } = useAccount();
  const { writeContract, isPending, error, isSuccess } = useWriteContract();

  const claimReward = async () => {
    if (!contractAddress || !userAddress) {
      throw new Error("Contract address or user address not available");
    }

    try {
      const result = await writeContract({
        address: contractAddress as `0x${string}`,
        abi,
        functionName: "claimReward",
        args: [userAddress as `0x${string}`],
      });

      console.log("result", result);
    } catch (err) {
      console.error("Error claiming reward:", err);
      throw err;
    }
  };

  return {
    claimReward,
    isPending,
    error,
    isSuccess,
  };
};
