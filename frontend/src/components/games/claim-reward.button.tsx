"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useFlipStore } from "@/lib/store";

export default function ClaimRewardButton() {
  const [isClaimingReward, setIsClaimingReward] = useState(false);
  const flipsSinceLastClaim = useFlipStore((s) => s.flipsSinceLastClaim);
  const lastClaimAt = useFlipStore((s) => s.lastClaimAt);
  const claimReward = useFlipStore((s) => s.claimReward);

  const COOLDOWN_MS = 3000; // 5 minutes

  const now = Date.now();
  const msSinceClaim = lastClaimAt ? now - lastClaimAt : Infinity;
  const msLeft = Math.max(0, COOLDOWN_MS - msSinceClaim);

  const canClaim = flipsSinceLastClaim >= 10 && msLeft === 0 && !isClaimingReward;

  // tick to update countdown once per second
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (msLeft === 0) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [lastClaimAt]);

  const countdownLabel = useMemo(() => {
    if (msLeft <= 0) return null;
    const totalSeconds = Math.ceil(msLeft / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    const mm = String(m).padStart(1, "0");
    const ss = String(s).padStart(2, "0");
    return `${mm}:${ss}`;
  }, [msLeft, tick]);

  const handleClaimReward = () => {
    if (!canClaim) return;
    setIsClaimingReward(true);
    console.log("Claiming reward");
    // Simulate async reward claiming; replace with real action
    setTimeout(() => {
      claimReward();
      setIsClaimingReward(false);
    }, 1200);
  };

  let label = "CLAIM REWARD 🎉";
  if (isClaimingReward) label = "CLAIMING...";
  else if (flipsSinceLastClaim < 10) label = `NEED ${10 - flipsSinceLastClaim} MORE FLIPS`;
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
