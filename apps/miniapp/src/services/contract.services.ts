import { useChainId, useWriteContract, useAccount } from "wagmi";

import { coinFlipContractAddress, abi } from "@/contracts/coin-flip.contract";
import { useSignTypedData } from "wagmi";

const getContractAddress = (chainId?: number) => {
  if (chainId === 84532) {
    return coinFlipContractAddress.baseSepolia;
  }

  if (chainId === 8453) {
    return coinFlipContractAddress.base;
  }

  return coinFlipContractAddress.baseSepolia;
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
export const useClaimReward = () => {
  const { address: contractAddress, chainId } = useContract();
  const { address: userAddress } = useAccount();
  const { writeContract, isPending, error, isSuccess } = useWriteContract();
  const { signTypedData, data: signature } = useSignTypedData();

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

  const claimRewardWithSiwe = async () => {
    const nonce = await fetch("/api/siwe/nonce");
    const { nonce: nonceData } = await nonce.json();

    const domain = {
      name: "CoinFlip",
      version: "1",
      chainId,
      verifyingContract: contractAddress as `0x${string}`,
    };

    const types = {
      Flip: [
        { name: "userAddress", type: "address" },
        { name: "flipCount", type: "uint256" },
        { name: "timestamp", type: "uint256" },
        { name: "nonce", type: "string" },
      ],
    };

    const message = {
      userAddress: userAddress as `0x${string}`,
      flipCount: 5,
      timestamp: Date.now(),
      nonce: nonceData,
    };

    signTypedData(
      {
        domain,
        types,
        primaryType: "Flip",
        message,
      },
      {
        onSuccess: async (signature) => {
          const verified = await fetch("/api/siwe/verify", {
            method: "POST",
            body: JSON.stringify({
              address: userAddress,
              message,
              signature,
              domain,
              types,
            }),
          });
          const { verified: verifiedData } = await verified.json();

          return { message, signature, verified: verifiedData };
        },
        onError: (error) => {
          console.error("Error signing typed data:", error);
          throw error;
        },
      }
    );
  };

  return {
    claimReward,
    claimRewardWithSiwe,
    isPending,
    error,
    isSuccess,
  };
};
