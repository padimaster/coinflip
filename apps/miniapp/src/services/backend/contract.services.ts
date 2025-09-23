import { getPublicClient, getWalletClient } from "@/config/backend.config";
import { FLIP_TO_EARN_FAUCET_CONTRACT_ABI as abi } from "@/contracts/abis";
import { getFlipToEarnFaucetContractAddress } from "../common/contracts.lib";
import { parseContractError } from "@/lib/error-utils";

export const getUserNonce = async (userAddress: string, chainId: number) => {
  const client = getPublicClient(chainId);
  const contractAddress = getFlipToEarnFaucetContractAddress(chainId);

  if (!contractAddress) {
    throw new Error(`No contract address found for chainId: ${chainId}`);
  }

  const userNonce = await client.readContract({
    address: contractAddress as `0x${string}`,
    abi,
    functionName: "getUserNonce",
    args: [userAddress as `0x${string}`],
  });

  return Number(userNonce);
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
    const client = getWalletClient(chainId);
    const formattedSignature = signature.startsWith('0x') ? signature : `0x${signature}`;

    console.debug('Claiming reward:', { address, flipCount: flipCount.toString(), contractAddress, chainId });

    const result = await client.writeContract({
      address: contractAddress as `0x${string}`,
      abi,
      functionName: "claimReward",
      args: [
        {
          userAddress: address as `0x${string}`,
          flipCount,
          minFlipsRequired,
          timestamp,
          nonce,
        },
        formattedSignature as `0x${string}`,
      ],
    });

    console.debug('Claim reward result:', result);
    return result;
  } catch (error) {
    const parsedError = parseContractError(error);
    const customError = new Error(parsedError.userMessage) as Error & { 
      contractError: typeof parsedError; 
      originalError: unknown; 
    };
    customError.contractError = parsedError;
    customError.originalError = error;
    throw customError;
  }
};
