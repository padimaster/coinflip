"use client";
import { Button } from "@/components/ui/button";
import GameHeader from "../../layout/game-header";
import { useFlipStore } from "@/lib/store";
import Coin from "../../coin/coin";
import ClaimRewardButton from "./claim-reward.button";
import RecentFlips from "./recent-flips";
import { useFreeGame } from "@/hooks/useFreeGame";

export default function CoinFlipGame() {
  const { state, handleFlipClick, isFlipping } = useFreeGame();

  return (
    <div className="flex flex-col items-center justify-between h-[calc(100vh-8rem)] py-8">
      <GameHeader headerText={state.headerText} />
      <ClaimRewardButton />
      <Coin state={state.state} result={state.result} />

      <Button variant="kawaii" onClick={handleFlipClick} disabled={isFlipping}>
        {state.buttonText}
      </Button>

      <RecentFlips history={useFlipStore((state) => state.history)} />
    </div>
  );
}
