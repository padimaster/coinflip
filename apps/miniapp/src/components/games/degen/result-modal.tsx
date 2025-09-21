"use client";
import { useAccount } from "wagmi";
import { ResultModalProps } from "./types";
import GameResultModal, { BetGameResult } from "../shared/game-result-modal";

export default function ResultModal({ isOpen, onClose, onNewBet, betResult }: ResultModalProps) {
  const { address } = useAccount();

  // Convert BetResult to BetGameResult for the reusable modal
  const gameResult: BetGameResult | null = betResult ? {
    type: "bet",
    won: betResult.won,
    amount: betResult.amount,
    side: betResult.side,
    result: betResult.result,
    timestamp: Date.now()
  } : null;

  return (
    <GameResultModal
      isOpen={isOpen}
      onClose={onClose}
      onNewGame={onNewBet}
      result={gameResult}
      userAddress={address}
      showShareButtons={true}
    />
  );
}
