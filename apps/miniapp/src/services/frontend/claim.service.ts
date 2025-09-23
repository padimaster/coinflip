import { ClaimRewardSignTypedData } from "../sign/sign.types";

export const getClaimRewardTypedData = async ({
  userAddress,
  chainId,
  contractAddress,
  flipsCount,
}: {
  userAddress: `0x${string}`;
  chainId: number;
  contractAddress: `0x${string}`;
  flipsCount: number;
}) => {
  if (
    !userAddress ||
    !contractAddress ||
    typeof chainId !== "number" ||
    typeof flipsCount !== "number"
  ) {
    throw new Error("Missing or invalid fields", {
      cause: { userAddress, contractAddress, chainId, flipsCount },
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
      flipsCount,
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
