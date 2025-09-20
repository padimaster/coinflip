import { useChainId, useWriteContract, useAccount } from "wagmi";

import { FAUCET_CONTRACT_ABI as abi } from "@/contracts/coin-flip.contract";
import { useSignTypedData } from "wagmi";
import { getFlipToEarnFaucetContractAddress } from "@/lib/contract";

// EIP-712 ClaimData struct interface
interface ClaimData extends Record<string, unknown> {
  userAddress: `0x${string}`;
  flipCount: number;
  minFlipsRequired: number;
  timestamp: number;
  nonce: number;
}

// EIP-712 domain interface
interface EIP712Domain {
  name: string;
  version: string;
  chainId: number;
  verifyingContract: `0x${string}`;
}

// EIP-712 types interface
interface EIP712Types extends Record<string, unknown> {
  ClaimData: Array<{
    name: string;
    type: string;
  }>;
}

const useContract = () => {
  const chainId = useChainId();
  const address = getFlipToEarnFaucetContractAddress(chainId);

  return {
    address,
    abi,
    chainId,
    isConnected: !!chainId,
  };
};

export const useClaimReward = () => {
  const { address: contractAddress, chainId } = useContract();
  const { address: userAddress } = useAccount();
  const { isPending, error, isSuccess } = useWriteContract();
  const { signTypedData } = useSignTypedData();

  const claimReward = async () => {
    const nonce = await fetch("/api/siwe/nonce");
    const { nonce: nonceData } = await nonce.json();

    // EIP-712 Domain definition
    const domain: EIP712Domain = {
      name: "CoinFlipFaucet",
      version: "1",
      chainId,
      verifyingContract: contractAddress as `0x${string}`,
    };

    // EIP-712 Types definition - must match contract's ClaimData struct
    const types: EIP712Types = {
      ClaimData: [
        { name: "userAddress", type: "address" },
        { name: "flipCount", type: "uint256" },
        { name: "minFlipsRequired", type: "uint256" },
        { name: "timestamp", type: "uint256" },
        { name: "nonce", type: "uint256" },
      ],
    };

    // ClaimData message - must match the struct fields exactly
    const message: ClaimData = {
      userAddress: userAddress as `0x${string}`,
      flipCount: 5,
      minFlipsRequired: 1,
      timestamp: Math.floor(Date.now() / 1000), // Convert to seconds and ensure it's in the past
      nonce: parseInt(nonceData), // Convert string to number
    };

    return new Promise((resolve, reject) => {
      signTypedData(
        {
          domain,
          types,
          primaryType: "ClaimData",
          message,
        },
        {
          onSuccess: async (signature) => {
            try {
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
              const { verified: verifiedData, result } = await verified.json();

              resolve({ message, signature, verified: verifiedData, result });
            } catch (error) {
              reject(error);
            }
          },
          onError: (error) => {
            console.error("Error signing typed data:", error);
            reject(error);
          },
        }
      );
    });
  };

  return {
    claimReward,
    isPending,
    error,
    isSuccess,
  };
};
