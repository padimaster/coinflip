"use client";
import { FlipResult } from "@/lib/store";
import GameResultModal, { FlipGameResult } from "../shared/game-result-modal";

export interface FreeResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNewFlip?: () => void;
  flipResult: FlipResult | null;
}

export default function FreeResultModal({ 
  isOpen, 
  onClose, 
  onNewFlip, 
  flipResult 
}: FreeResultModalProps) {
  // Convert FlipResult to FlipGameResult for the reusable modal
  const gameResult: FlipGameResult | null = flipResult ? {
    type: "flip",
    result: flipResult,
    timestamp: Date.now()
  } : null;

  return (
    <GameResultModal
      isOpen={isOpen}
      onClose={onClose}
      onNewGame={onNewFlip}
      result={gameResult}
      showShareButtons={false} // Free mode doesn't need sharing
    />
  );
}
