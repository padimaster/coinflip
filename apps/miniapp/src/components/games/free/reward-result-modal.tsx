"use client";
import GameResultModal, { RewardGameResult } from "../shared/game-result-modal";

export interface RewardResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  rewardAmount: number;
  flipsRequired: number;
  flipsCompleted: number;
}

export default function RewardResultModal({ 
  isOpen, 
  onClose, 
  rewardAmount,
  flipsRequired,
  flipsCompleted
}: RewardResultModalProps) {
  const gameResult: RewardGameResult = {
    type: "reward",
    amount: rewardAmount,
    flipsRequired,
    flipsCompleted,
    timestamp: Date.now()
  };

  return (
    <GameResultModal
      isOpen={isOpen}
      onClose={onClose}
      result={gameResult}
      showShareButtons={false} // Reward claims don't need sharing
    />
  );
}
