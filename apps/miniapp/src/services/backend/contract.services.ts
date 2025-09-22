import { getPublicClient, getWalletClient } from "@/config/backend.config";
import { FLIP_TO_EARN_FAUCET_CONTRACT_ABI as abi } from "@/contracts/abis";
import { getFlipToEarnFaucetContractAddress } from "../common/contracts.lib";
import { parseContractError, ContractError } from "@/lib/error-utils";

export const getUserNonce = async (userAddress: string, chainId: number) => {
  const client = getPublicClient(chainId);
  const contractAddress = getFlipToEarnFaucetContractAddress(chainId);

  console.log("getUserNonce - chainId:", chainId);
  console.log("getUserNonce - contractAddress:", contractAddress);
  console.log("getUserNonce - userAddress:", userAddress);

  if (!contractAddress) {
    throw new Error(`No contract address found for chainId: ${chainId}`);
  }

  const userNonce = await client.readContract({
    address: contractAddress as `0x${string}`,
    abi,
    functionName: "getUserNonce",
    args: [userAddress as `0x${string}`],
  });

  return userNonce.toString();
};

export const getMinFlipsRequired = async (chainId: number) => {
  const client = getPublicClient(chainId);
  const contractAddress = getFlipToEarnFaucetContractAddress(chainId);

  const minFlipsRequired = await client.readContract({
    address: contractAddress as `0x${string}`,
    abi,
    functionName: "minFlipsRequired",
  });

  // Convert BigInt to string for JSON serialization
  return minFlipsRequired.toString();
};

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
    
    // Parse the error to get user-friendly message
    const parsedError = parseContractError(error);
    
    // Create a custom error with the parsed information
    const customError = new Error(parsedError.userMessage);
    (customError as any).contractError = parsedError;
    (customError as any).originalError = error;
    
    throw customError;
  }
};
