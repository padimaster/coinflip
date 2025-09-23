import { useChainId, useAccount } from "wagmi";

import { useSignTypedData } from "wagmi";
import { getFlipToEarnFaucetContractAddress } from "@/services/common/contracts.lib";
import { useFlipStore } from "@/lib/store";
import {
  requestBaseAccounts,
  useBaseProvider,
} from "@/providers/base.provider";

const useContract = () => {
  const chainId = useChainId();
  const address = getFlipToEarnFaucetContractAddress(chainId);

  return {
    address,
    chainId,
    isConnected: !!chainId,
  };
};

export const useClaimReward = () => {
  const { address: contractAddress, chainId } = useContract();
  const { address: userAddress } = useAccount();
  const { signTypedData } = useSignTypedData();
  const { flipsSinceLastClaim } = useFlipStore();
  const provider = useBaseProvider();

  const claimReward = async () => {
    if (!chainId) {
      throw new Error("Chain ID is required. Please connect your wallet.");
    }

    if (!userAddress) {
      throw new Error("User address is required. Please connect your wallet.");
    }

    if (!contractAddress) {
      throw new Error("Contract address not found for the current chain.");
    }

    const baseAddresses = await requestBaseAccounts(provider);
    const baseAddress = baseAddresses[0];

    const dataToSign = await fetch("/api/claim/sign/message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userAddress: provider ? baseAddress : (userAddress as `0x${string}`),
        contractAddress,
        chainId,
        flipCount: flipsSinceLastClaim,
      }),
    });

    const claimRewardTypedDataToSign = await dataToSign.json();

    console.log("claimRewardTypedDataToSign", claimRewardTypedDataToSign);

    if (provider) {
      const signature = await provider.request({
        method: "eth_signTypedData_v4",
        params: [baseAddress, JSON.stringify(claimRewardTypedDataToSign)],
      });

      console.log("signatureFromBase", signature);

      const verified = await fetch("/api/claim/sign/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: baseAddress,
          signedTypedData: claimRewardTypedDataToSign,
          signature,
        }),
      });

      if (!verified.ok) {
        const errorData = await verified.json();
        // If the API returns structured error data, use it
        if (errorData.error) {
          throw new Error(errorData.error);
        }
        throw new Error(`Verification with base provider failed: ${verified}`);
      }

      const result = await verified.json();

      console.log("verifiedFromBase", result);

      return result;
    }

    console.log("Base Provider Not Found", provider);

    return new Promise((resolve, reject) => {
      signTypedData(claimRewardTypedDataToSign, {
        onSuccess: async (signature) => {
          try {
            const verified = await fetch("/api/claim/sign/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                address: userAddress,
                signedTypedData: claimRewardTypedDataToSign,
                signature,
              }),
            });

            if (!verified.ok) {
              const errorData = await verified.json();
              // If the API returns structured error data, use it
              if (errorData.error) {
                throw new Error(errorData.error);
              }
              throw new Error(`Verification failed: ${verified}`);
            }

            const result = await verified.json();
            resolve(result);
          } catch (error) {
            console.error("Error in verification process:", error);
            reject(error);
          }
        },
        onError: (error) => {
          console.error("Error signing typed data:", error);
          reject(error);
        },
      });
    });
  };

  return {
    claimReward,
  };
};
