import { useCoinFlip } from "./useCoinFlip";

export function useFreeGame() {
  const coinFlip = useCoinFlip({
    initialHeaderText: "FLIP ME!",
    initialButtonText: "Flip",
    flippingHeaderText: "FLIPPING...",
    flippingButtonText: "FLIPPING...",
    getResultHeaderText: (result) => result === "heads" ? "HEADS!" : "TAILS!",
    getResultButtonText: () => "FLIP AGAIN!",
  });

  const handleFlipClick = async () => {
    if (coinFlip.isFlipping) return;
    await coinFlip.flipCoin();
  };

  return {
    state: coinFlip.state,
    handleFlipClick,
    resetGame: coinFlip.resetGame,
    isFlipping: coinFlip.isFlipping,
  };
}
