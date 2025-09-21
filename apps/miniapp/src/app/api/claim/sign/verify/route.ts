import { claimReward } from "@/services/backend/contract.services";
import { ClaimRewardSignTypedData } from "@/services/sign/sign.types";
import { NextRequest, NextResponse } from "next/server";
import { verifyTypedData } from "viem";

interface VerifySignedTypedData {
  address: `0x${string}`;
  signedTypedData: ClaimRewardSignTypedData;
  signature: `0x${string}`;
}

export async function POST(req: NextRequest) {
  try {
    const { address, signedTypedData, signature } =
      (await req.json()) as VerifySignedTypedData;

    const { message, domain, types, primaryType } =
      signedTypedData as ClaimRewardSignTypedData;

    if (!address || !message || !signature || !domain || !types) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          data: { signedTypedData, address, signature },
        },
        { status: 400 }
      );
    }

    const verified = await verifyTypedData({
      address,
      domain,
      types,
      primaryType,
      message,
      signature,
    });

    if (!verified) {
      return NextResponse.json(
        {
          error: "Signed typed data verification failed",
          details: "Invalid signature",
        },
        { status: 400 }
      );
    }

    console.log("Verified!!!! From API");

    const result = await claimReward(
      address,
      BigInt(message.flipCount),
      BigInt(message.minFlipsRequired),
      BigInt(message.timestamp),
      BigInt(message.nonce),
      signature,
      domain.verifyingContract,
      domain.chainId
    );

    console.log("Result!!!! From API", result);

    return NextResponse.json({ verified, signedTypedData, result });
  } catch (error) {
    console.error("Signed typed data verification error:", error);
    return NextResponse.json(
      {
        error: "Signed typed data verification failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 }
    );
  }
}
