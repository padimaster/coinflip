import { NextRequest, NextResponse } from "next/server";
import {
  getClaimRewardSignDomain,
  getClaimRewardSignTypes,
} from "@/services/sign/sign.lib";
import {
  ClaimRewardSignMessage,
  FLIP_TO_EARN_SIGN_PRIMARY_TYPE,
} from "@/services/sign/sign.types";
import { getUserNonce } from "@/services/backend/contract.services";

export interface GetTypedDataToSignBody {
  userAddress: `0x${string}`;
  contractAddress: `0x${string}`;
  chainId: number;
  flipsCount: number;
}

const MIN_FLIPS_REQUIRED = 5;

export async function POST(req: NextRequest) {
  try {
    const { userAddress, contractAddress, chainId, flipsCount } =
      (await req.json()) as GetTypedDataToSignBody;

    console.log("📝 Generating typed data with params:", {
      userAddress,
      contractAddress,
      chainId,
      flipsCount,
    });

    if (!userAddress || !contractAddress || !chainId || !flipsCount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const domain = getClaimRewardSignDomain(chainId, contractAddress);
    const types = getClaimRewardSignTypes();
    const nonce = await getUserNonce(userAddress, chainId);

    console.log("🔍 Generated components:", {
      domain,
      typesKeys: Object.keys(types),
      nonce,
    });

    const message: ClaimRewardSignMessage = {
      userAddress,
      flipsCount,
      minFlipsRequired: MIN_FLIPS_REQUIRED,
      timestamp: Math.floor(Date.now() / 1000),
      nonce,
    };

    const typedData = {
      domain,
      types,
      primaryType: FLIP_TO_EARN_SIGN_PRIMARY_TYPE.ClaimData,
      message,
    };

    // Enhanced validation
    if (!domain || !types || !message) {
      console.error("❌ Missing core components:", {
        domain: !!domain,
        types: !!types,
        message: !!message,
      });
      return NextResponse.json(
        { error: "Failed to generate typed data components" },
        { status: 500 }
      );
    }

    // Validate EIP712Domain is present
    if (!types.EIP712Domain) {
      console.error("❌ Missing EIP712Domain in types:", types);
      return NextResponse.json(
        { error: "Missing EIP712Domain in types structure" },
        { status: 500 }
      );
    }

    // Validate all required fields in message
    const requiredFields = [
      "userAddress",
      "flipsCount",
      "minFlipsRequired",
      "timestamp",
      "nonce",
    ];
    const missingFields = requiredFields.filter(
      (field) => message[field as keyof ClaimRewardSignMessage] === undefined
    );

    if (missingFields.length > 0) {
      console.error("❌ Missing message fields:", missingFields);
      return NextResponse.json(
        { error: `Missing message fields: ${missingFields.join(", ")}` },
        { status: 500 }
      );
    }

    console.log(
      "✅ Generated complete typed data:",
      JSON.stringify(typedData, null, 2)
    );

    return NextResponse.json(typedData);
  } catch (error) {
    console.error("❌ Error generating typed data:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
