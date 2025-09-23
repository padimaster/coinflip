import { ClaimRewardSignTypedData } from "@/services/sign/sign.types";
import { NextRequest, NextResponse } from "next/server";
import { getPublicClient } from "@/config/backend.config";

export interface SignedTypedData {
  address: `0x${string}`;
  signedTypedData: ClaimRewardSignTypedData;
  signature: `0x${string}`;
}

export async function POST(req: NextRequest) {
  try {
    const requestBody = await req.json();
    const { address, signedTypedData, signature } =
      requestBody as SignedTypedData;

    console.log("🔍 Starting verification process");
    console.log("👤 Address:", address);
    console.log(
      "📝 Signature length:",
      typeof signature === "string" ? signature.length : "N/A"
    );

    // Extract components
    const { message, domain, types, primaryType } =
      signedTypedData as ClaimRewardSignTypedData;

    // Basic validation
    if (!address || !message || !signature || !domain || !types) {
      const missing = [];
      if (!address) missing.push("address");
      if (!message) missing.push("message");
      if (!signature) missing.push("signature");
      if (!domain) missing.push("domain");
      if (!types) missing.push("types");

      console.error("❌ Missing required fields:", missing);
      return NextResponse.json(
        {
          error: "Missing required fields",
          details: `Missing: ${missing.join(", ")}`,
          data: {
            hasAddress: !!address,
            hasMessage: !!message,
            hasSignature: !!signature,
            hasDomain: !!domain,
            hasTypes: !!types,
          },
        },
        { status: 400 }
      );
    }

    // Enhanced logging
    console.log("🏢 Domain:", JSON.stringify(domain, null, 2));
    console.log("📋 Primary Type:", primaryType);
    console.log("🔧 Types available:", Object.keys(types || {}));
    console.log("💬 Message:", JSON.stringify(message, null, 2));

    // Get blockchain client
    const client = getPublicClient(domain.chainId);

    // Check if address is a smart contract
    const bytecode = await client.getCode({ address });
    const isContract = !!(bytecode && bytecode !== "0x");

    console.log(`🏠 Address type: ${isContract ? "Smart Contract" : "EOA"}`);
    if (isContract) {
      console.log(`📦 Bytecode length: ${bytecode?.length || 0}`);
    }

    // Additional validation for types structure
    if (!types.EIP712Domain) {
      console.error("❌ Missing EIP712Domain in types");
      return NextResponse.json(
        {
          error: "Invalid types structure",
          details: "Missing EIP712Domain type definition",
          availableTypes: Object.keys(types),
        },
        { status: 400 }
      );
    }

    // Validate message structure
    const expectedMessageFields = [
      "userAddress",
      "flipCount",
      "minFlipsRequired",
      "timestamp",
      "nonce",
    ];
    const messageFields = Object.keys(message || {});
    const missingFields = expectedMessageFields.filter(
      (field) => !(field in (message || {}))
    );

    if (missingFields.length > 0) {
      console.error(
        "❌ Invalid message structure, missing fields:",
        missingFields
      );
      return NextResponse.json(
        {
          error: "Invalid message structure",
          details: `Missing fields: ${missingFields.join(", ")}`,
          expected: expectedMessageFields,
          received: messageFields,
        },
        { status: 400 }
      );
    }

    console.log("🔐 Attempting signature verification...");

    // Simple verification
    const valid = await client.verifyTypedData({
      address,
      domain,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      types: types as any,
      primaryType,
      message,
      signature,
    });

    if (!valid) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    console.log("✅ Signature verification successful!");
    return NextResponse.json({
      verified: true,
      address,
      message,
      verificationMethod: isContract ? "ERC-1271/ERC-6492" : "ECDSA",
      result: "Signature verified successfully",
    });
  } catch (error) {
    console.error("💥 Verification endpoint error:", error);

    return NextResponse.json(
      {
        error: "Internal verification error",
        details: error instanceof Error ? error.message : String(error),
        verified: false,
      },
      { status: 500 }
    );
  }
}
