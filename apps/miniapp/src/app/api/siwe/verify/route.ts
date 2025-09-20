import { claimReward } from "@/services/backend/contract.services";
import { NextRequest, NextResponse } from "next/server";
import { verifyTypedData } from "viem";

export async function POST(req: NextRequest) {
  try {
    const { address, message, signature, domain, types } = await req.json();

    console.log("Received request:", { address, message, signature, domain, types });

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

    // Validate message values before converting to BigInt
    if (typeof message.flipCount !== 'number' || isNaN(message.flipCount)) {
      return NextResponse.json(
        { error: "Invalid flipCount value" },
        { status: 400 }
      );
    }
    
    if (typeof message.minFlipsRequired !== 'number' || isNaN(message.minFlipsRequired)) {
      return NextResponse.json(
        { error: "Invalid minFlipsRequired value" },
        { status: 400 }
      );
    }
    
    if (typeof message.timestamp !== 'number' || isNaN(message.timestamp)) {
      return NextResponse.json(
        { error: "Invalid timestamp value" },
        { status: 400 }
      );
    }
    
    if (typeof message.nonce !== 'number' || isNaN(message.nonce)) {
      return NextResponse.json(
        { error: "Invalid nonce value" },
        { status: 400 }
      );
    }

    console.log("About to call claimReward with:", {
      address,
      flipCount: message.flipCount,
      minFlipsRequired: message.minFlipsRequired,
      timestamp: message.timestamp,
      nonce: message.nonce,
      signature,
      contractAddress: domain.verifyingContract,
      chainId: domain.chainId
    });

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
