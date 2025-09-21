"use client";
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDropAmount } from "@/hooks/useDropAmount";
import { formatEthAmount } from "@/lib/utils";
import { useFlipStore } from "@/lib/store";

export interface RewardClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  claimedAmount?: string;
  flipsCompleted?: number;
}

export default function RewardClaimModal({
  isOpen,
  onClose,
  claimedAmount,
  flipsCompleted,
}: RewardClaimModalProps) {
  const { dropAmount, isLoading } = useDropAmount();
  const flipsSinceLastClaim = useFlipStore((s) => s.flipsSinceLastClaim);

  // Use the captured flip count if available, otherwise fallback to current store value
  const displayFlips =
    flipsCompleted !== undefined ? flipsCompleted : flipsSinceLastClaim;

  // Use the claimed amount from backend if available, otherwise fallback to contract amount
  const ethAmount = claimedAmount || formatEthAmount(dropAmount);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100%-4rem)] bg-gray-900 border-2 border-gray-600 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            <div className="pixel-font text-2xl font-bold mb-4 text-green-300">
              🎉 REWARD CLAIMED! 🎉
            </div>

            <div className="space-y-3">
              <div className="bg-green-900/30 rounded-lg p-3 border border-green-400">
                <p className="text-green-200 font-bold text-lg">
                  +{ethAmount} ETH
                </p>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-600">
                <p className="text-gray-200 text-sm">
                  <span className="text-white font-bold">Flips completed:</span>{" "}
                  {displayFlips}
                </p>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="text-center space-y-4">
          <div className="space-y-3 pt-4">
            <Button variant="kawaii" className="w-full" onClick={onClose}>
              CONTINUE
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
