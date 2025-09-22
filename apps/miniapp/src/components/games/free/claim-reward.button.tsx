"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useFlipStore } from "@/lib/store";
import { useClaimReward } from "@/services/frontend/contract.services";
import { useAccount } from "wagmi";
import RewardClaimModal from "./reward-claim-modal";

const MIN_FLIPS_BEFORE_CLAIM = 5;

interface BackendClaimResult {
  verified: boolean;
  result?: string; // Transaction hash
  signedTypedData?: any;
}

export default function ClaimRewardButton() {
  const [isClaimingReward, setIsClaimingReward] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [claimedAmount, setClaimedAmount] = useState<string | undefined>();
  const [flipsCompleted, setFlipsCompleted] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const flipsSinceLastClaim = useFlipStore((s) => s.flipsSinceLastClaim);
  const lastClaimAt = useFlipStore((s) => s.lastClaimAt);
  const claimRewardStore = useFlipStore((s) => s.claimReward);

  // Contract interaction hooks
  const { isConnected } = useAccount();
  const { claimReward } = useClaimReward();

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

  const handleClaimReward = async () => {
    if (!canClaim) return;
    setIsClaimingReward(true);
    setErrorMessage(null); // Clear any previous error
    console.log("Claiming reward via contract");

    // Capture the flip count before it gets reset
    const currentFlips = flipsSinceLastClaim;
    setFlipsCompleted(currentFlips);

    try {
      const result = await claimReward() as BackendClaimResult;

      claimRewardStore();
      console.log("=== BACKEND CLAIM RESULT ===");
      console.log("Success:", result?.verified);
      console.log("Full result:", result);
      console.log("Flips completed:", currentFlips);
      
      if (result?.verified && result?.result) {
        console.log("Transaction hash:", result.result);
        console.log("Claim was successful!");
        // Note: The actual amount claimed would need to be extracted from the transaction
        // For now, we'll let the modal fetch it from the contract
        setShowRewardModal(true);
      } else {
        console.log("Claim failed or verification failed");
        setErrorMessage("Claim failed. Please try again.");
      }
    } catch (err) {
      console.error("=== CLAIM FAILED ===");
      console.error("Error:", err);
      
      // Display user-friendly error message
      const errorMsg = err instanceof Error ? err.message : "An unexpected error occurred. Please try again.";
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
