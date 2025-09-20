"use client";
import { Button } from "@/components/ui/button";
import { PlaceBetButtonProps } from "./types";

export default function PlaceBetButton({ 
  selectedSide, 
  isPlacingBet, 
  walletBalance, 
  betAmount, 
  coinState,
  onPlaceBet 
}: PlaceBetButtonProps) {
  const isDisabled = !selectedSide || isPlacingBet || walletBalance < betAmount;

  const getButtonText = () => {
    if (isPlacingBet) {
      return coinState === 'flipping' ? 'FLIPPING...' : 'PLACING BET...';
    }
    return 'PLACE BET';
  };

  return (
    <Button
      variant="kawaii"
      className={`w-full py-4 text-lg font-bold transition-all duration-300 ${
        isDisabled
          ? 'opacity-50 cursor-not-allowed' 
          : 'hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl'
      }`}
      onClick={onPlaceBet}
      disabled={isDisabled}
    >
      {getButtonText()}
    </Button>
  );
}
