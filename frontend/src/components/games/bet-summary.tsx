"use client";
import { BetSummaryProps } from "./types";

export default function BetSummary({ betAmount, selectedSide, isPlacingBet, coinState }: BetSummaryProps) {
  if (!selectedSide || isPlacingBet) return null;

  return (
    <div className="bg-gray-800/40 rounded-lg p-3 border border-gray-600">
      <p className="text-gray-200 text-sm">
        <span className="text-white font-bold">{betAmount} ETH</span> on{' '}
        <span className={`font-bold ${
          selectedSide === 'heads' ? 'text-pink-300' : 'text-blue-300'
        }`}>
          {selectedSide.toUpperCase()}
        </span>
      </p>
    </div>
  );
}
