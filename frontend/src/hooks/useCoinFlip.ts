import { useState } from "react";
import { useFlipStore } from "@/lib/store";
import { CoinSide, CoinFlipState } from "@/components/games/types";

interface CoinFlipGameState {
  state: CoinFlipState;
  result: CoinSide;
  buttonText: string;
  headerText: string;
}

interface UseCoinFlipOptions {
  initialHeaderText: string;
  initialButtonText: string;
  flippingHeaderText: string;
  flippingButtonText: string;
  getResultHeaderText: (result: CoinSide) => string;
  getResultButtonText: (result: CoinSide) => string;
  flipDuration?: number;
}

export function useCoinFlip(options: UseCoinFlipOptions) {
  const {
    initialHeaderText,
    initialButtonText,
    flippingHeaderText,
    flippingButtonText,
    getResultHeaderText,
    getResultButtonText,
    flipDuration = 2000,
  } = options;

  const [state, setState] = useState<CoinFlipGameState>({
    state: "initial",
    result: "heads",
    buttonText: initialButtonText,
    headerText: initialHeaderText,
  });

  const startFlipping = () => {
    setState((prev: CoinFlipGameState) => ({
      ...prev,
      state: "flipping" as CoinFlipState,
      headerText: flippingHeaderText,
      buttonText: flippingButtonText,
    }));
  };

  const finishFlipping = (result: CoinSide) => {
    setState((prev: CoinFlipGameState) => ({
      ...prev,
      state: "result" as CoinFlipState,
      result,
      headerText: getResultHeaderText(result),
      buttonText: getResultButtonText(result),
    }));

    // Record flip in global store
    useFlipStore.getState().recordFlip(result);
  };

  const resetGame = () => {
    setState({
      state: "initial" as CoinFlipState,
      result: "heads",
      buttonText: initialButtonText,
      headerText: initialHeaderText,
    });
  };

  const flipCoin = async (): Promise<CoinSide> => {
    return new Promise((resolve) => {
      startFlipping();
      
      setTimeout(() => {
        const isHeads = Math.random() < 0.5;
        const result = isHeads ? "heads" : "tails";
        finishFlipping(result);
        resolve(result);
      }, flipDuration);
    });
  };

  const isFlipping = state.state === "flipping";
  const isInitial = state.state === "initial";
  const isResult = state.state === "result";

  return {
    state,
    flipCoin,
    resetGame,
    isFlipping,
    isInitial,
    isResult,
  };
}
