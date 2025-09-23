import {
  FlipToEarnSignDomain,
  ClaimRewardSignTypes,
} from "./sign.types";

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
    EIP712Domain: [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' }
    ],
    ClaimData: [
      { name: "userAddress", type: "address" },
      { name: "flipsCount", type: "uint256" },
      { name: "minFlipsRequired", type: "uint256" },
      { name: "timestamp", type: "uint256" },
      { name: "nonce", type: "uint256" },
    ],
  };

  return types;
};
