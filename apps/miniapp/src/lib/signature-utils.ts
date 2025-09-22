import { isHex } from "viem";

/**
 * Decodes ABI-encoded signature format to extract the actual ECDSA signature
 * Handles Base miniapp signature format that comes as ABI-encoded bytes
 * 
 * @param signature - The ABI-encoded signature string
 * @returns The extracted ECDSA signature
 * @throws Error if the signature format is invalid
 */
export function decodeAbiEncodedSignature(signature: string): `0x${string}` {
  // Remove any whitespace and ensure it starts with 0x
  let normalized = signature.trim();
  if (!normalized.startsWith('0x')) {
    normalized = `0x${normalized}`;
  }
  
  // Validate hex format
  if (!isHex(normalized)) {
    throw new Error(`Invalid hex signature: ${signature}`);
  }
  
  // Remove 0x prefix for processing
  const data = normalized.substring(2);
  
  // Check if this looks like ABI-encoded data (starts with length prefix)
  if (data.length > 128) { // At least 64 chars for length prefix + some data
    try {
      // Parse ABI-encoded structure: [length_prefix][data_length][data_offset][signature_length][signature_data]
      const lengthPrefix = data.substring(0, 64);
      const actualData = data.substring(64);
      
      const dataLength = parseInt(actualData.substring(0, 64), 16);
      const dataOffset = parseInt(actualData.substring(64, 128), 16);
      const signatureLength = parseInt(actualData.substring(128, 192), 16);
      
      // Extract the actual signature (should be 65 bytes = 130 hex chars)
      const signatureData = actualData.substring(192, 192 + (signatureLength * 2));
      const extractedSignature = `0x${signatureData}`;
      
      console.log(`Decoded ABI-encoded signature: length=${signatureLength}, extracted=${extractedSignature}`);
      
      // Validate the extracted signature length
      if (extractedSignature.length === 132) { // 0x + 130 hex chars = 65 bytes
        return extractedSignature as `0x${string}`;
      }
    } catch (error) {
      console.warn(`Failed to decode as ABI-encoded signature: ${error}`);
    }
  }
  
  // If not ABI-encoded or decoding failed, return as-is
  return normalized as `0x${string}`;
}

/**
 * Normalizes signature format to ensure compatibility across different environments
 * Handles Base miniapp signature format differences and standard ECDSA signatures
 * 
 * @param signature - The raw signature string
 * @returns The normalized signature in proper format
 * @throws Error if the signature format is invalid
 */
export function normalizeSignature(signature: string): `0x${string}` {
  // First try to decode as ABI-encoded signature
  try {
    const decoded = decodeAbiEncodedSignature(signature);
    if (decoded.length === 132) { // Valid 65-byte signature
      return decoded;
    }
  } catch (error) {
    console.warn(`ABI decoding failed, falling back to normalization: ${error}`);
  }
  
  // Fallback to original normalization logic
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
 * Validates if a signature has the correct format for ECDSA
 * 
 * @param signature - The signature to validate
 * @returns True if the signature format is valid
 */
export function isValidSignatureFormat(signature: string): boolean {
  try {
    const normalized = normalizeSignature(signature);
    return normalized.length === 132; // 0x + 130 hex chars = 65 bytes
  } catch {
    return false;
  }
}

/**
 * Gets the signature format type for debugging purposes
 * 
 * @param signature - The signature to analyze
 * @returns A string describing the signature format
 */
export function getSignatureFormat(signature: string): string {
  const length = signature.length;
  
  if (length === 132) {
    return "Standard ECDSA (65 bytes)";
  } else if (length === 130) {
    return "ECDSA without 0x prefix (65 bytes)";
  } else if (length === 128) {
    return "ECDSA without recovery ID (64 bytes)";
  } else if (length > 200) {
    return "ABI-encoded signature";
  } else {
    return `Unknown format (${length} chars)`;
  }
}
