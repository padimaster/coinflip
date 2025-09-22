import { verifyTypedData } from "viem";
import { normalizeSignature } from "./signature-utils";

/**
 * Result of signature verification
 */
export interface SignatureVerificationResult {
  verified: boolean;
  workingSignature: `0x${string}`;
  error?: string;
}

/**
 * Parses and verifies signature with proper format detection
 * Handles both ABI-encoded signatures (Base miniapp) and standard ECDSA signatures
 * 
 * @param address - The address that should have signed the message
 * @param domain - The EIP-712 domain
 * @param types - The EIP-712 types
 * @param primaryType - The primary type for the message
 * @param message - The message data
 * @param signature - The raw signature string
 * @returns Promise with verification result
 */
export async function parseAndVerifySignature(
  address: `0x${string}`,
  domain: Record<string, unknown>,
  types: Record<string, unknown>,
  primaryType: string,
  message: Record<string, unknown>,
  signature: string
): Promise<SignatureVerificationResult> {
  console.log("Parsing signature:", signature);
  console.log("Signature length:", signature.length);
  
  try {
    // Parse the signature to get the actual ECDSA signature
    const parsedSignature = normalizeSignature(signature);
    console.log("Parsed signature:", parsedSignature);
    console.log("Parsed signature length:", parsedSignature.length);
    
    // Verify the parsed signature
    const verified = await verifyTypedData({ 
      address, 
      domain, 
      types, 
      primaryType, 
      message, 
      signature: parsedSignature 
    });
    
    console.log("Signature verification result:", verified);
    
    return { 
      verified, 
      workingSignature: parsedSignature 
    };
  } catch (error) {
    console.error("Signature verification failed:", error);
    return { 
      verified: false, 
      workingSignature: signature as `0x${string}`,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Validates signature format without verification
 * Useful for pre-validation before attempting verification
 * 
 * @param signature - The signature to validate
 * @returns True if the signature format is valid
 */
export function validateSignatureFormat(signature: string): boolean {
  try {
    const normalized = normalizeSignature(signature);
    return normalized.length === 132; // 0x + 130 hex chars = 65 bytes
  } catch (error) {
    console.warn("Signature format validation failed:", error);
    return false;
  }
}
