import { claimReward } from "@/services/backend/contract.services";
import { NextRequest, NextResponse } from "next/server";
import { SignedTypedData } from "../verify/route";
import { ClaimRewardSignTypedData } from "@/services/sign/sign.types";

export async function POST(req: NextRequest) {
  try {
    const requestBody = await req.json();
    console.debug('Claim API request body:', requestBody);
    
    const { address, signedTypedData, signature } = requestBody as SignedTypedData;

    // Validate required fields
    if (!address || !signedTypedData || !signature) {
      const missing = [address ? null : "address", signedTypedData ? null : "signedTypedData", signature ? null : "signature"]
        .filter(Boolean);
      console.debug('Missing required fields:', missing);
      return NextResponse.json(
        { error: "Missing required fields", details: `Missing: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    const { message, domain } = signedTypedData as ClaimRewardSignTypedData;
    console.debug('Parsed typed data:', { message, domain });

    if (!message || !domain) {
      console.debug('Invalid typed data structure - missing message or domain');
      return NextResponse.json(
        { error: "Invalid typed data structure" },
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

    return NextResponse.json({ success: true, result });

  } catch (error) {
    console.debug('Claim API error:', error);
    
    // Handle contract-specific errors
    if (error && typeof error === 'object' && 'contractError' in error) {
      const contractError = (error as any).contractError;
      console.debug('Contract error details:', contractError);
      return NextResponse.json(
        { error: "Contract execution failed", details: contractError.userMessage },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
