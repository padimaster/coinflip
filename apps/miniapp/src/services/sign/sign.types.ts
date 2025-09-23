export interface ClaimRewardSignTypedData {
  domain: FlipToEarnSignDomain;
  types: ClaimRewardSignTypes;
  primaryType: FLIP_TO_EARN_SIGN_PRIMARY_TYPE;
  message: ClaimRewardSignMessage;
}

export interface ClaimRewardSignMessage extends Record<string, unknown> {
  userAddress: `0x${string}`;
  flipsCount: number;
  minFlipsRequired: number;
  timestamp: number;
  nonce: number; // Should be number to match uint256 type
}

// SIGNATURE DOMAIN
export interface FlipToEarnSignDomain extends Record<string, unknown> {
  name: string;
  version: string;
  chainId: number;
  verifyingContract: `0x${string}`;
}

// SIGNATURE TYPES
export interface ClaimRewardSignTypes extends Record<string, unknown> {
  EIP712Domain: Array<{
    name: string;
    type: string;
  }>;
  ClaimData: Array<{
    name: string;
    type: string;
  }>;
}

export enum FLIP_TO_EARN_SIGN_PRIMARY_TYPE {
  ClaimData = "ClaimData",
}
