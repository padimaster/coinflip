"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import GameHeader from "../layout/game-header";
import { CoinState } from "@/lib/types";
import { useFlipStore } from "@/lib/store";
import Coin from "../coin/coin";
import ClaimRewardButton from "./claim-reward.button";
import RecentFlips from "./recent-flips";

export default function CoinFlipGame() {
  const [state, setState] = useState<CoinState>({
    state: "initial",
    result: "heads",
    buttonText: "Flip",
    headerText: "FLIP ME!",
  });

  const handleFlipClick = () => {
    // Ignore clicks while flipping
    setState((prev) => {
      if (prev.state === "flipping") return prev;

      return {
        ...prev,
        state: "flipping",
        headerText: "FLIPPING...",
      };
    });

    // After a brief delay, show the result
    setTimeout(() => {
      const isHeads = Math.random() < 0.5;
      const result = isHeads ? "heads" : ("tails" as const);

      setState((prev) => ({
        ...prev,
        state: "result",
        result,
        headerText: result === "heads" ? "HEADS!" : "TAILS!",
      }));

      // Record flip in global store
      useFlipStore.getState().recordFlip(result);
    }, 2000);
  };

  return (
    <div className="flex flex-col items-center justify-between h-[calc(100vh-4rem)] py-8">
      <GameHeader headerText={state.headerText} />
      <ClaimRewardButton />
      <Coin state={state.state} result={state.result} />

      <Button variant="kawaii" onClick={handleFlipClick}>
        Flip
      </Button>

      <RecentFlips history={useFlipStore((state) => state.history)} />

    </div>
  );
}
