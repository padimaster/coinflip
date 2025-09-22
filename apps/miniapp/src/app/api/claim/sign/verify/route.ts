import { claimReward } from "@/services/backend/contract.services";
import { ClaimRewardSignTypedData } from "@/services/sign/sign.types";
import { NextRequest, NextResponse } from "next/server";
import { verifyTypedData, isHex } from "viem";
import { parseContractError, ContractError } from "@/lib/error-utils";

interface VerifySignedTypedData {
  address: `0x${string}`;
  signedTypedData: ClaimRewardSignTypedData;
  signature: `0x${string}`;
}

/**
 * Normalizes signature format to ensure compatibility across different environments
 * Handles Base miniapp signature format differences
 */
function normalizeSignature(signature: string): `0x${string}` {
  // Remove any whitespace
  let normalized = signature.trim();
  
  // Ensure it starts with 0x
  if (!normalized.startsWith('0x')) {
    normalized = `0x${normalized}`;
  }
  
  // Validate hex format
  if (!isHex(normalized)) {
    throw new Error(`Invalid hex signature: ${signature}`);
  }
  
  // Check signature length - ECDSA signatures should be 65 bytes (130 hex chars + 0x)
  const hexLength = normalized.length - 2; // Remove 0x prefix
  
  if (hexLength === 128) {
    // 64 bytes - might be missing recovery ID, add 0x00
    normalized = `${normalized}00`;
  } else if (hexLength === 130) {
    // 65 bytes - correct length
    // Do nothing
  } else if (hexLength === 132) {
    // 66 bytes - might have extra recovery ID, remove last byte
    normalized = normalized.slice(0, -2);
  } else {
    console.warn(`Unexpected signature length: ${hexLength} hex chars (${hexLength / 2} bytes)`);
    console.warn(`Original signature: ${signature}`);
    console.warn(`Normalized signature: ${normalized}`);
  }
  
  return normalized as `0x${string}`;
}

/**
 * Attempts to verify signature with multiple normalization strategies
 * This helps handle different signature formats from various wallet implementations
 * Returns both verification result and the working signature
 */
async function verifySignatureWithFallback(
  address: `0x${string}`,
  domain: any,
  types: any,
  primaryType: string,
  message: any,
  signature: string
): Promise<{ verified: boolean; workingSignature: `0x${string}` }> {
  const strategies = [
    // Strategy 1: Use original signature as-is
    {
      name: "original",
      getSignature: () => signature as `0x${string}`,
      verify: (sig: `0x${string}`) => verifyTypedData({ address, domain, types, primaryType, message, signature: sig })
    },
    
    // Strategy 2: Normalize signature
    {
      name: "normalized",
      getSignature: () => normalizeSignature(signature),
      verify: (sig: `0x${string}`) => verifyTypedData({ address, domain, types, primaryType, message, signature: sig })
    },
    
    // Strategy 3: Try with recovery ID 0x00
    {
      name: "recovery_00",
      getSignature: () => {
        const normalized = normalizeSignature(signature);
        const baseSig = normalized.slice(0, -2); // Remove last byte
        return `${baseSig}00` as `0x${string}`;
      },
      verify: (sig: `0x${string}`) => verifyTypedData({ address, domain, types, primaryType, message, signature: sig })
    },
    
    // Strategy 4: Try with recovery ID 0x01
    {
      name: "recovery_01",
      getSignature: () => {
        const normalized = normalizeSignature(signature);
        const baseSig = normalized.slice(0, -2); // Remove last byte
        return `${baseSig}01` as `0x${string}`;
      },
      verify: (sig: `0x${string}`) => verifyTypedData({ address, domain, types, primaryType, message, signature: sig })
    }
  ];
  
  for (let i = 0; i < strategies.length; i++) {
    try {
      const workingSignature = strategies[i].getSignature();
      const result = await strategies[i].verify(workingSignature);
      if (result) {
        console.log(`Signature verification succeeded with strategy ${i + 1} (${strategies[i].name})`);
        return { verified: true, workingSignature };
      }
    } catch (error) {
      console.log(`Strategy ${i + 1} (${strategies[i].name}) failed:`, error);
      continue;
    }
  }
  
  return { verified: false, workingSignature: signature as `0x${string}` };
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
    
    // Use fallback verification to handle different signature formats
    const { verified, workingSignature } = await verifySignatureWithFallback(
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
          details: "Invalid signature - all verification strategies failed",
        },
        { status: 400 }
      );
    }

    console.log("Verified!!!! From API");
    console.log("Working signature:", workingSignature);

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
