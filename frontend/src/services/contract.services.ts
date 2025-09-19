import { useChainId, useWriteContract, useAccount } from "wagmi";

import { coinFlipContractAddress, abi } from "@/contracts/coin-flip.contract";


 const getContractAddress = (chainId?: number) => {
  if (chainId === 84532) {
    return coinFlipContractAddress.baseSepolia;
  } 
  
  if (chainId === 8453) {
    return coinFlipContractAddress.base;
  }

  return coinFlipContractAddress.baseSepolia;
};


 const useContractAddress = () => {
  const chainId = useChainId();
  return getContractAddress(chainId);
};

 const useContract = () => {
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
 const useClaimReward = () => {
  const { address: contractAddress } = useContract();
  const { address: userAddress } = useAccount();
  const { writeContract, isPending, error, isSuccess } = useWriteContract();

  const claimReward = async () => {
    if (!contractAddress || !userAddress) {
      throw new Error("Contract address or user address not available");
    }

    try {
      await writeContract({
        address: contractAddress as `0x${string}`,
        abi,
        functionName: "claimReward",
        args: [userAddress as `0x${string}`],
      });
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

 const getNetworkInfo = (chainId?: number) => {
  const networks = {
    84532: { name: 'Base Sepolia', isTestnet: true },
    8453: { name: 'Base Mainnet', isTestnet: false },
  };
  
  return networks[chainId as keyof typeof networks] || { name: 'Unknown Network', isTestnet: true };
};
