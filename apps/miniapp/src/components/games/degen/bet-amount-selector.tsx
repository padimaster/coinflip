"use client";
import { BetAmountSelectorProps } from "./types";

export default function BetAmountSelector({ 
  betAmount, 
  onAmountSelect, 
  walletBalance, 
  disabled = false,
  betAmounts = [0.001, 0.005, 0.01, 0.05, 0.1]
}: BetAmountSelectorProps) {
  return (
    <div className="space-y-3">
      <p className="pixel-font text-white text-sm mb-3 text-center font-bold">
        BET AMOUNT (ETH)
      </p>
      <div className="grid grid-cols-3 gap-2 mb-3">
        {betAmounts.map((amount) => {
          const canAfford = walletBalance >= amount;
          return (
            <button
              key={amount}
              className={`pixel-font text-sm p-3 rounded-lg border-2 transition-all duration-300 hover:scale-105 ${
                betAmount === amount
                  ? "border-yellow-400 bg-yellow-500/40 text-yellow-100 shadow-lg shadow-yellow-500/25"
                  : canAfford
                  ? "border-gray-500 bg-gray-700/50 text-gray-200 hover:border-gray-400 hover:bg-gray-600/50"
                  : "border-red-500 bg-red-600/30 text-red-200 opacity-60 cursor-not-allowed"
              }`}
              onClick={() => canAfford && onAmountSelect(amount)}
              disabled={!canAfford || disabled}
              title={!canAfford ? `Insufficient funds (need ${amount} ETH)` : ''}
            >
              {amount}
            </button>
          );
        })}
      </div>
      {walletBalance < betAmount && (
        <div className="text-center bg-red-800/30 rounded-lg p-3 border border-red-600">
          <p className="text-red-300 text-sm font-bold">
            ⚠️ Insufficient funds
          </p>
        </div>
      )}
    </div>
  );
}
