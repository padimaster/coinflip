import { ClaimRewardSignTypedData } from "../sign/sign.types";

export const getClaimRewardTypedData = async ({
  userAddress,
  chainId,
  contractAddress,
  flipCount,
}: {
  userAddress: `0x${string}`;
  chainId: number;
  contractAddress: `0x${string}`;
  flipCount: number;
}) => {
  if (
    !userAddress ||
    !contractAddress ||
    typeof chainId !== "number" ||
    typeof flipCount !== "number"
  ) {
    throw new Error("Missing or invalid fields", {
      cause: { userAddress, contractAddress, chainId, flipCount },
    });
  }

  const result = await fetch("/api/claim/sign/message", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userAddress,
      contractAddress,
      chainId,
      flipCount,
    }),
  });

  if (!result.ok) {
    const err = await safeJson(result);
    throw new Error(err?.error || "Failed to get typed data", {
      cause: err,
    });
  }

  const typedDataToSign = await result.json();

  return typedDataToSign;
};

export const verifyClaimRewardTypedData = async (
  address: `0x${string}`,
  typedDataToSign: ClaimRewardSignTypedData,
  signature: string
) => {
  const result = await fetch("/api/claim/sign/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      address,
      signedTypedData: typedDataToSign,
      signature,
    }),
  });

  const payload = await safeJson(result);
  if (!result.ok) {
    throw new Error(payload?.error || "Verification failed", {
      cause: payload,
    });
  }

  return payload;
};

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export const claimReward = async (
  address: `0x${string}`,
  signedTypedData: ClaimRewardSignTypedData,
  signature: string
) => {
  const result = await fetch("/api/claim/sign/claim", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      address,
      signedTypedData,
      signature,
    }),
  });

  const payload = await safeJson(result);
  if (!result.ok) {
    throw new Error(payload?.error || "Claim failed", {
      cause: payload,
    });
  }

  return payload;
};
