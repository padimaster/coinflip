import { getWalletClient } from "@/config/backend.config";
import {
  FAUCET_CONTRACT_ABI as abi,
} from "@/contracts/coin-flip.contract";

export const claimReward = async (
  address: string,
  flipCount: bigint,
  minFlipsRequired: bigint,
  timestamp: bigint,
  nonce: bigint,
  signature: string,
  contractAddress: string,
  chainId: number
) => {
  try {
    console.log("contractAddress", contractAddress);
    console.log("chainId", chainId);
    console.log("address", address);
    console.log("flipCount", flipCount);
    console.log("minFlipsRequired", minFlipsRequired);
    console.log("timestamp", timestamp);
    console.log("nonce", nonce);
    console.log("signature", signature);

    // Get the appropriate client based on chain ID
    const client = getWalletClient(chainId);

    if (!contractAddress) {
      throw new Error("Contract address is required");
    }

    const result = await client.writeContract({
      address: contractAddress as `0x${string}`,
      abi,
      functionName: "claimReward",
      args: [
        {
          userAddress: address as `0x${string}`,
          flipCount: flipCount as bigint,
          minFlipsRequired: minFlipsRequired as bigint,
          timestamp: timestamp as bigint,
          nonce: nonce as bigint,
        },
        signature as `0x${string}`,
      ],
    });

    return result;
  } catch (error) {
    console.error("Error claiming reward:", error);
    throw error;
  }
};
