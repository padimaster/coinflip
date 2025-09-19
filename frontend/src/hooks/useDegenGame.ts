import { useState } from "react";
import { useAccount, useBalance } from "wagmi";
import { BetResult, CoinSide } from "@/components/games/types";
import { useCoinFlip } from "./useCoinFlip";

export function useDegenGame() {
  const { address } = useAccount();
  const { data: balance } = useBalance({ address });

  // Bet state
  const [selectedSide, setSelectedSide] = useState<CoinSide | null>(null);
  const [betAmount, setBetAmount] = useState<number>(0.001);
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const [lastBetResult, setLastBetResult] = useState<BetResult | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);

  // Use the base coin flip hook
  const coinFlip = useCoinFlip({
    initialHeaderText: "DEGEN MODE",
    initialButtonText: "PLACE BET",
    flippingHeaderText: "FLIPPING...",
    flippingButtonText: "FLIPPING...",
    getResultHeaderText: (result: CoinSide) => {
      const won = result === selectedSide;
      return won ? "YOU WON! 🎉" : "YOU LOST 😢";
    },
    getResultButtonText: () => "BET AGAIN",
  });

  // Constants
  const betAmounts = [0.001, 0.005, 0.01, 0.05, 0.1];
  const walletBalance = balance ? parseFloat(balance.formatted) : 0;

  const placeBet = async () => {
    if (!selectedSide || !address || isPlacingBet) return;

    setIsPlacingBet(true);

    try {
      // Use the base flip logic
      const result = await coinFlip.flipCoin();
      const won = result === selectedSide;

      // Record result
      const betResult: BetResult = {
        won,
        amount: betAmount,
        side: selectedSide,
        result,
      };
      setLastBetResult(betResult);
      setShowResultModal(true);

    } catch (error) {
      console.error("Error placing bet:", error);
      coinFlip.resetGame();
    } finally {
      setIsPlacingBet(false);
    }
  };

  const resetGame = () => {
    setSelectedSide(null);
    setLastBetResult(null);
    setShowResultModal(false);
    coinFlip.resetGame();
  };

  const closeResultModal = () => {
    setShowResultModal(false);
  };

  // Computed values
  const canPlaceBet = selectedSide && !isPlacingBet && walletBalance >= betAmount;

  return {
    // State from coin flip
    state: coinFlip.state,
    isFlipping: coinFlip.isFlipping,
    
    // Bet state
    selectedSide,
    betAmount,
    isPlacingBet,
    lastBetResult,
    showResultModal,
    betAmounts,
    walletBalance,
    
    // Actions
    setSelectedSide,
    setBetAmount,
    placeBet,
    resetGame,
    closeResultModal,
    
    // Computed
    canPlaceBet,
  };
}
