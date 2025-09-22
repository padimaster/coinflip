import { claimReward } from "@/services/backend/contract.services";
import { ClaimRewardSignTypedData } from "@/services/sign/sign.types";
import { NextRequest, NextResponse } from "next/server";
import { verifyTypedData } from "viem";
import { parseContractError, ContractError } from "@/lib/error-utils";

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
    
    // Check if this is a contract error with parsed information
    if (error instanceof Error && 'contractError' in error) {
      const contractError: ContractError = (error as Error & { contractError: ContractError }).contractError;
      
      return NextResponse.json(
        {
          error: contractError.userMessage,
          code: contractError.code,
          details: contractError.message,
          type: "contract_error",
        },
        { status: 400 }
      );
    }
    
    // Handle other types of errors
    const parsedError = parseContractError(error);
    
    return NextResponse.json(
      {
        error: parsedError.userMessage,
        code: parsedError.code,
        details: parsedError.message,
        type: "verification_error",
      },
      { status: 400 }
    );
  }
}
