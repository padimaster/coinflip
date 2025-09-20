import { NextRequest, NextResponse } from "next/server";
import { getPublicClient } from "@/config/backend.config";
import { FAUCET_CONTRACT_ABI } from "@/contracts/coin-flip.contract";
import { getFlipToEarnFaucetContractAddress } from "@/lib/contract";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userAddress = searchParams.get('userAddress');
    const chainId = parseInt(searchParams.get('chainId') || '31337');

    if (!userAddress) {
      return NextResponse.json({ error: "User address is required" }, { status: 400 });
    }

    // Get the contract address for the chain
    const contractAddress = getFlipToEarnFaucetContractAddress(chainId);
    
    if (!contractAddress) {
      return NextResponse.json({ error: "Contract address not found for chain" }, { status: 400 });
    }

    // Get the appropriate public client based on chain ID
    const client = getPublicClient(chainId);

    // Get the user's current nonce from the contract
    const currentNonce = await client.readContract({
      address: contractAddress as `0x${string}`,
      abi: FAUCET_CONTRACT_ABI,
      functionName: "getUserNonce",
      args: [userAddress as `0x${string}`],
    });

    return NextResponse.json({ nonce: currentNonce.toString() });
  } catch (error) {
    console.error("Error getting nonce:", error);
    return NextResponse.json({ error: "Failed to get nonce" }, { status: 500 });
  }
}
