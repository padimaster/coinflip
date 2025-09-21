import { NextRequest, NextResponse } from "next/server";
import { getClaimRewardSignedTypedData } from "@/services/sign/sign.lib";

interface GetTypedDataToSignBody {
  userAddress: `0x${string}`;
  contractAddress: `0x${string}`;
  chainId: number;
  flipCount: number;
}

const MIN_FLIPS_REQUIRED = 5;

export async function POST(req: NextRequest) {
  const { userAddress, contractAddress, chainId, flipCount } =
    (await req.json()) as GetTypedDataToSignBody;

  if (!userAddress || !contractAddress || !chainId || !flipCount) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const signedTypedData = await getClaimRewardSignedTypedData(
    userAddress,
    contractAddress,
    chainId,
    flipCount,
    MIN_FLIPS_REQUIRED
  );

  if (!signedTypedData) {
    return NextResponse.json(
      { error: "Failed to get signed typed data" },
      { status: 500 }
    );
  }

  return NextResponse.json(signedTypedData);
}
