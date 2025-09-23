"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useFlipStore } from "@/lib/store";
import { useAccount, useChainId, useSignTypedData } from "wagmi";
import { useIsInMiniApp } from "@coinbase/onchainkit/minikit";
import RewardClaimModal from "./reward-claim-modal";
import {
  getClaimRewardTypedData,
  verifyClaimRewardTypedData,
  claimReward,
} from "@/services/frontend/claim.service";
import {
  requestBaseAccounts,
  useBaseProvider,
} from "@/providers/base.provider";
import { ClaimRewardSignTypedData } from "@/services/sign/sign.types";
import { getFlipToEarnFaucetContractAddress } from "@/services/common/contracts.lib";
import { GetTypedDataToSignBody } from "@/app/api/claim/sign/message/route";

const MIN_FLIPS_BEFORE_CLAIM = 5;

export default function ClaimRewardButton() {
  const [isClaimingReward, setIsClaimingReward] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [claimedAmount, setClaimedAmount] = useState<string | undefined>();
  const [flipsCompleted, setFlipsCompleted] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const flipsSinceLastClaim = useFlipStore((s) => s.flipsSinceLastClaim);
  const lastClaimAt = useFlipStore((s) => s.lastClaimAt);
  const claimRewardStore = useFlipStore((s) => s.claimReward);

  const { address: userAddress } = useAccount();
  const chainId = useChainId();
  const contractAddress = getFlipToEarnFaucetContractAddress(chainId);

  // Contract interaction hooks
  const { isConnected } = useAccount();
  const provider = useBaseProvider();
  const { isInMiniApp } = useIsInMiniApp();
  const { signTypedData } = useSignTypedData();

  const COOLDOWN_MS = 3000;

  const now = Date.now();
  const msSinceClaim = lastClaimAt ? now - lastClaimAt : Infinity;
  const msLeft = Math.max(0, COOLDOWN_MS - msSinceClaim);

  const canClaim =
    flipsSinceLastClaim >= MIN_FLIPS_BEFORE_CLAIM &&
    msLeft === 0 &&
    !isClaimingReward &&
    isConnected;

  // tick to update countdown once per second
  const [, setTick] = useState(0);
  useEffect(() => {
    if (msLeft === 0) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [lastClaimAt, msLeft]);

  const countdownLabel = useMemo(() => {
    if (msLeft <= 0) return null;
    const totalSeconds = Math.ceil(msLeft / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    const mm = String(m).padStart(1, "0");
    const ss = String(s).padStart(2, "0");
    return `${mm}:${ss}`;
  }, [msLeft]);

  // Helper function to clean signature (currently unused)
  /*
  function cleanSignature(rawSignature: unknown): string {
    console.log("🧹 Cleaning signature:", {
      type: typeof rawSignature,
      length: typeof rawSignature === "string" ? rawSignature.length : "N/A",
      sample:
        typeof rawSignature === "string"
          ? `${rawSignature.slice(0, 20)}...${rawSignature.slice(-20)}`
          : rawSignature,
    });

    if (typeof rawSignature !== "string") {
      throw new Error(
        `Expected signature to be string, got ${typeof rawSignature}`
      );
    }

    let signature = rawSignature;

    // Handle abnormally long signatures (like your 2882-char case)
    if (signature.length > 200) {
      console.warn(
        `⚠️ Signature abnormally long (${signature.length} chars), attempting to extract...`
      );

      // Strategy 1: Look for standard ECDSA signature pattern
      const ecdsaPattern = /0x[a-fA-F0-9]{130}/g;
      const matches = signature.match(ecdsaPattern);

      if (matches && matches.length > 0) {
        signature = matches[0];
        console.log("✅ Found ECDSA signature pattern:", signature);
      } else {
        // Strategy 2: Check if it's a smart wallet signature (variable length but valid hex)
        if (signature.startsWith("0x") && /^0x[a-fA-F0-9]+$/.test(signature)) {
          console.log(
            "📱 Detected potential smart wallet signature, keeping full length"
          );
          // Keep the full signature for smart wallets
        } else {
          throw new Error("Could not extract valid signature format");
        }
      }
    }

    // Basic validation
    if (!signature.startsWith("0x")) {
      signature = "0x" + signature;
    }

    if (!/^0x[a-fA-F0-9]+$/.test(signature)) {
      throw new Error("Signature contains invalid hex characters");
    }

    // For EOA signatures, should be exactly 132 chars (0x + 130 hex chars)
    // For smart wallets, can be variable length
    if (signature.length === 132) {
      console.log("✅ Standard EOA signature format detected");
    } else {
      console.log(
        `📱 Non-standard signature length (${signature.length}), assuming smart wallet`
      );
    }

    return signature;
  }
  */

  const handleClaimReward = async () => {
    if (!canClaim) return;
    setIsClaimingReward(true);
    setErrorMessage(null);

    try {
      let address: string;
      let signature: string;
      let typedDataToSign: ClaimRewardSignTypedData;

      if (isInMiniApp) {
        // Use Base Account Provider for miniapp
        const baseAddresses = await requestBaseAccounts(provider);
        address = baseAddresses[0];

        if (!address) {
          throw new Error("No wallet address found");
        }

        // Generate typed data
        typedDataToSign = await getClaimRewardTypedData({
          userAddress: address as `0x${string}`,
          chainId: chainId as number,
          contractAddress: contractAddress as `0x${string}`,
          flipCount: flipsSinceLastClaim,
        } satisfies GetTypedDataToSignBody);

        // Sign the typed data using Base provider
        signature = (await provider.request({
          method: "eth_signTypedData_v4",
          params: [address, typedDataToSign],
        })) as string;
      } else {
        // Use wagmi signTypedData for regular web
        if (!userAddress) {
          throw new Error("No wallet address found");
        }

        address = userAddress;

        // Generate typed data
        typedDataToSign = await getClaimRewardTypedData({
          userAddress: address as `0x${string}`,
          chainId: chainId as number,
          contractAddress: contractAddress as `0x${string}`,
          flipCount: flipsSinceLastClaim,
        } satisfies GetTypedDataToSignBody);

        // Sign the typed data using wagmi
        signature = await new Promise<string>((resolve, reject) => {
          signTypedData({
            domain: typedDataToSign.domain,
            types: typedDataToSign.types,
            primaryType: typedDataToSign.primaryType,
            message: typedDataToSign.message,
          }, {
            onSuccess: (sig) => resolve(sig),
            onError: (error) => reject(error),
          });
        });
      }

      // Verify signature
      const result = await verifyClaimRewardTypedData(
        address as `0x${string}`,
        typedDataToSign as ClaimRewardSignTypedData,
        signature as `0x${string}`
      );

      if (!result.verified) {
        throw new Error(result.error || "Signature verification failed");
      }

      const claimResult = await claimReward(
        address as `0x${string}`,
        typedDataToSign as ClaimRewardSignTypedData,
        signature as `0x${string}`
      );

      if (!claimResult) {
        throw new Error("Failed to claim reward");
      }

      // Success!
      claimRewardStore();
      setFlipsCompleted(flipsSinceLastClaim);
      setShowRewardModal(true);
    } catch (err) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred. Please try again.";
      setErrorMessage(errorMsg);
    } finally {
      setIsClaimingReward(false);
    }
  };

  let label = "CLAIM REWARD 🎉";
  if (isClaimingReward) label = "CLAIMING...";
  else if (!isConnected) label = "CONNECT WALLET";
  else if (flipsSinceLastClaim < MIN_FLIPS_BEFORE_CLAIM)
    label = `NEED ${MIN_FLIPS_BEFORE_CLAIM - flipsSinceLastClaim} MORE FLIPS`;
  else if (msLeft > 0 && countdownLabel) label = `WAIT ${countdownLabel}`;

  return (
    <>
      <div className="space-y-3 w-full max-w-sm mx-auto flex flex-col items-center justify-center">
        <Button
          variant="kawaii"
          onClick={handleClaimReward}
          disabled={!canClaim}
          aria-busy={isClaimingReward}
          title={!canClaim ? label : undefined}
          className=""
        >
          {label}
        </Button>

        {errorMessage && (
          <div className="bg-red-900/20 border-2 border-red-400/60 rounded-xl p-4 shadow-lg backdrop-blur-sm animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center animate-pulse">
                  <span className="text-red-400 text-sm">⚠</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-red-100 text-sm leading-relaxed">
                  {errorMessage}
                </p>
                <button
                  onClick={() => setErrorMessage(null)}
                  className="text-red-300 hover:text-red-100 text-xs font-medium underline mt-2 transition-colors duration-200 hover:no-underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <RewardClaimModal
        isOpen={showRewardModal}
        onClose={() => {
          setShowRewardModal(false);
          setClaimedAmount(undefined);
          setFlipsCompleted(0);
        }}
        claimedAmount={claimedAmount}
        flipsCompleted={flipsCompleted}
      />
    </>
  );
}
