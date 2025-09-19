"use client";
import { BetStatusProps } from "./types";

export default function BetStatus({ isPlacingBet, coinState }: BetStatusProps) {
  if (!isPlacingBet) return null;

  return (
    <div className="text-center bg-yellow-900/20 rounded-lg p-3 border border-yellow-500/30">
      <div className="text-3xl mb-2 animate-spin">🪙</div>
      <p className="text-yellow-200 text-sm font-bold">
        {coinState === 'flipping' ? '🎲 Flipping coin...' : '⏳ Processing transaction...'}
      </p>
    </div>
  );
}
