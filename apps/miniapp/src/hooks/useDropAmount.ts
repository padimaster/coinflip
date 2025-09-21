import { useReadContract } from "wagmi";
import { FLIP_TO_EARN_FAUCET_CONTRACT_ABI } from "@/contracts/abis";
import { getFlipToEarnFaucetContractAddress } from "@/services/common/contracts.lib";
import { useChainId } from "wagmi";

export const useDropAmount = () => {
  const chainId = useChainId();
  const contractAddress = getFlipToEarnFaucetContractAddress(chainId);

  const { data: dropAmount, isLoading, error } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: FLIP_TO_EARN_FAUCET_CONTRACT_ABI,
    functionName: "getDropAmount",
  });

  return {
    dropAmount: dropAmount as bigint | undefined,
    isLoading,
    error,
  };
};
