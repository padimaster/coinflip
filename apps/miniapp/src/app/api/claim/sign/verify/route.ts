import { claimReward } from "@/services/backend/contract.services";
import { ClaimRewardSignTypedData } from "@/services/sign/sign.types";
import { NextRequest, NextResponse } from "next/server";
import { parseContractError, ContractError } from "@/lib/error-utils";
import { parseAndVerifySignature } from "@/lib/signature-verification";

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

    console.log("Original signature:", signature);
    console.log("Signature length:", signature.length);
    
    // Parse and verify signature with proper format detection
    const { verified, workingSignature } = await parseAndVerifySignature(
      address,
      domain,
      types,
      primaryType,
      message,
      signature
    );

    if (!verified) {
      return NextResponse.json(
        {
          error: "Signed typed data verification failed",
          details: "Signature verification failed - signature does not match the provided typed data",
          debug: {
            originalSignatureLength: signature.length,
            parsedSignatureLength: workingSignature.length,
            signatureFormat: signature.length > 200 ? "ABI-encoded" : "Standard ECDSA"
          }
        },
        { status: 400 }
      );
    }

    console.log("Verified!!!! From API");
    console.log("Working signature:", workingSignature);
    console.log("Working signature length:", workingSignature.length);
    console.log("Original signature length:", signature.length);

    const result = await claimReward(
      address,
      BigInt(message.flipCount),
      BigInt(message.minFlipsRequired),
      BigInt(message.timestamp),
      BigInt(message.nonce),
      workingSignature,
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
