import { claimReward } from "@/services/backend/contract.services";
import { NextRequest, NextResponse } from "next/server";
import { SignedTypedData } from "../verify/route";
import { ClaimRewardSignTypedData } from "@/services/sign/sign.types";

export async function POST(req: NextRequest) {
  const { address, signedTypedData, signature } =
    (await req.json()) as SignedTypedData;

  const { message, domain } = signedTypedData as ClaimRewardSignTypedData;

  const result = await claimReward(
    address,
    BigInt(message.flipsCount),
    BigInt(message.minFlipsRequired),
    BigInt(message.timestamp),
    BigInt(message.nonce),
    signature,
    domain.verifyingContract,
    domain.chainId
  );

  if (!result) {
    return NextResponse.json(
      { error: "Failed to claim reward", result },
      { status: 400 }
    );
  }

  return NextResponse.json({ result });
}
