export interface ClaimRewardSignTypedData {
  domain: FlipToEarnSignDomain;
  types: ClaimRewardSignTypes;
  primaryType: FLIP_TO_EARN_SIGN_PRIMARY_TYPE;
  message: ClaimRewardSignMessage;
}

export interface ClaimRewardSignMessage extends Record<string, unknown> {
  userAddress: `0x${string}`;
  flipCount: number;
  minFlipsRequired: number;
  timestamp: number;
  nonce: string; // Changed to string for JSON serialization
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
  ClaimData: Array<{
    name: string;
    type: string;
  }>;
}

export enum FLIP_TO_EARN_SIGN_PRIMARY_TYPE {
  ClaimData = "ClaimData",
}
