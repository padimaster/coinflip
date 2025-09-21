import { getUserNonce } from "../backend/contract.services";
import {
  ClaimRewardSignMessage,
  FlipToEarnSignDomain,
  ClaimRewardSignTypes,
  FLIP_TO_EARN_SIGN_PRIMARY_TYPE,
  ClaimRewardSignTypedData,
} from "./sign.types";

export const getClaimRewardSignedTypedData = async (
  userAddress: `0x${string}`,
  contractAddress: string,
  chainId: number,
  flipCount: number,
  minFlipsRequired: number
): Promise<ClaimRewardSignTypedData> => {
  const domain = getClaimRewardSignDomain(chainId, contractAddress);
  const types = getClaimRewardSignTypes();
  const nonce = await getUserNonce(userAddress, chainId);

  const message: ClaimRewardSignMessage = {
    userAddress,
    flipCount,
    minFlipsRequired,
    timestamp: Math.floor(Date.now() / 1000),
    nonce,
  };

  return {
    domain,
    types,
    primaryType: FLIP_TO_EARN_SIGN_PRIMARY_TYPE.ClaimData,
    message,
  };
};

export const getClaimRewardSignDomain = (
  chainId: number,
  contractAddress: string
) => {
  const domain: FlipToEarnSignDomain = {
    name: "CoinFlipFaucet",
    version: "1",
    chainId,
    verifyingContract: contractAddress as `0x${string}`,
  };

  return domain;
};

export const getClaimRewardSignTypes = (): ClaimRewardSignTypes => {
  const types: ClaimRewardSignTypes = {
    ClaimData: [
      { name: "userAddress", type: "address" },
      { name: "flipCount", type: "uint256" },
      { name: "minFlipsRequired", type: "uint256" },
      { name: "timestamp", type: "uint256" },
      { name: "nonce", type: "uint256" },
    ],
  };

  return types;
};
