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
    
    // Debug: Log all the verification parameters
    console.log("=== Signature Verification Debug ===");
    console.log("Address:", address);
    console.log("Domain:", JSON.stringify(domain, null, 2));
    console.log("Types:", JSON.stringify(types, null, 2));
    console.log("Primary Type:", primaryType);
    console.log("Message:", JSON.stringify(message, null, 2));
    console.log("Signature:", parsedSignature);
    console.log("=====================================");
    
    // Try verification with the parsed signature first
    let verified = await verifyTypedData({ 
      address, 
      domain, 
      types, 
      primaryType, 
      message, 
      signature: parsedSignature 
    });
    
    console.log("Signature verification result:", verified);
    
    // If verification failed, try with different recovery IDs
    if (!verified && parsedSignature.length === 132) {
      console.log("Trying with different recovery IDs...");
      
      const baseSignature = parsedSignature.slice(0, -2); // Remove last byte
      
      // Try with recovery ID 0x00
      const sigWithRecovery00 = `${baseSignature}00` as `0x${string}`;
      console.log("Trying recovery ID 0x00:", sigWithRecovery00);
      verified = await verifyTypedData({ 
        address, 
        domain, 
        types, 
        primaryType, 
        message, 
        signature: sigWithRecovery00 
      });
      
      if (verified) {
        console.log("Verification succeeded with recovery ID 0x00");
        return { 
          verified: true, 
          workingSignature: sigWithRecovery00 
        };
      }
      
      // Try with recovery ID 0x01
      const sigWithRecovery01 = `${baseSignature}01` as `0x${string}`;
      console.log("Trying recovery ID 0x01:", sigWithRecovery01);
      verified = await verifyTypedData({ 
        address, 
        domain, 
        types, 
        primaryType, 
        message, 
        signature: sigWithRecovery01 
      });
      
      if (verified) {
        console.log("Verification succeeded with recovery ID 0x01");
        return { 
          verified: true, 
          workingSignature: sigWithRecovery01 
        };
      }
      
      console.log("All recovery ID attempts failed");
    }
    
    // If still not verified, try with the original signature as-is (in case it's not ABI-encoded)
    if (!verified) {
      console.log("Trying with original signature as-is...");
      try {
        verified = await verifyTypedData({ 
          address, 
          domain, 
          types, 
          primaryType, 
          message, 
          signature: signature as `0x${string}` 
        });
        
        if (verified) {
          console.log("Verification succeeded with original signature");
          return { 
            verified: true, 
            workingSignature: signature as `0x${string}` 
          };
        }
      } catch (error) {
        console.log("Original signature verification failed:", error);
      }
    }
    
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
