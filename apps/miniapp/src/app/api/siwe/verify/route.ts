import { claimReward } from "@/services/backend/contract.services";
import { NextRequest, NextResponse } from "next/server";
import { verifyTypedData } from "viem";

export async function POST(req: NextRequest) {
  try {
    const { address, message, signature, domain, types } = await req.json();

    if (!address || !message || !signature || !domain || !types) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const verified = await verifyTypedData({
      address,
      domain,
      types,
      primaryType: "ClaimData",
      message,
      signature,
    });

    console.log("verified", verified);

    if (!verified) {
      return NextResponse.json(
        { error: "Verification failed", details: "Invalid signature" },
        { status: 400 }
      );
    }

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

    console.log("result", result);

    return NextResponse.json({ verified, result });
  } catch (error) {
    console.error("SIWE verification error:", error);
    return NextResponse.json(
      {
        error: "Verification failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 }
    );
  }
}
