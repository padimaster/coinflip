"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useFlipStore } from "@/lib/store";
import { useClaimReward } from "@/services/contract.services";
import { useAccount } from "wagmi";

const MIN_FLIPS_BEFORE_CLAIM = 2;

export default function ClaimRewardButton() {
  const [isClaimingReward, setIsClaimingReward] = useState(false);
  const flipsSinceLastClaim = useFlipStore((s) => s.flipsSinceLastClaim);
  const lastClaimAt = useFlipStore((s) => s.lastClaimAt);
  const claimRewardStore = useFlipStore((s) => s.claimReward);

  // Contract interaction hooks
  const { isConnected } = useAccount();
  const {
    claimReward: contractClaimReward,
    isPending,
    error,
    isSuccess,
  } = useClaimReward();

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

  // Handle successful contract interaction
  useEffect(() => {
    if (isSuccess) {
      console.log("Reward claimed successfully!");
      // The local store will be updated in handleClaimReward
    }
  }, [isSuccess]);

  // Handle contract errors
  useEffect(() => {
    if (error) {
      console.error("Contract error:", error);
    }
  }, [error]);

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
    console.log("Claiming reward via contract");

    try {
      const result = await contractClaimReward();

      claimRewardStore();
      console.log("Reward claimed successfully!", result);
    } catch (err) {
      console.error("Failed to claim reward:", err);
    } finally {
      setIsClaimingReward(false);
    }
  };

  let label = "CLAIM REWARD 🎉";
  if (isClaimingReward || isPending) label = "CLAIMING...";
  else if (!isConnected) label = "CONNECT WALLET";
  else if (flipsSinceLastClaim < MIN_FLIPS_BEFORE_CLAIM)
    label = `NEED ${MIN_FLIPS_BEFORE_CLAIM - flipsSinceLastClaim} MORE FLIPS`;
  else if (msLeft > 0 && countdownLabel) label = `WAIT ${countdownLabel}`;

  return (
    <Button
      variant="kawaii"
      onClick={handleClaimReward}
      disabled={!canClaim}
      aria-busy={isClaimingReward}
      title={!canClaim ? label : undefined}
    >
      {label}
    </Button>
  );
}
