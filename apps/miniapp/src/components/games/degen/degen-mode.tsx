"use client";
import GameHeader from "../../layout/game-header";
import Coin from "../../coin/coin";
import { useWallet } from "@/hooks/useWallet";
import { useDegenGame } from "@/hooks/useDegenGame";
import SideSelector from "./side-selector";
import BetAmountSelector from "./bet-amount-selector";
import BetSummary from "./bet-summary";
import PlaceBetButton from "./place-bet-button";
import ResultModal from "./result-modal";
import WarningBanner from "./warning-banner";

export default function DegenModeGame() {
  const { isConnected } = useWallet();
  const {
    state,
    selectedSide,
    betAmount,
    isPlacingBet,
    lastBetResult,
    showResultModal,
    betAmounts,
    walletBalance,
    setSelectedSide,
    setBetAmount,
    placeBet,
    resetGame,
    closeResultModal,
  } = useDegenGame();

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-8 pb-16">
        <GameHeader headerText="CONNECT WALLET" />
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            Connect your wallet to start betting
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-between h-full px-4 py-8 max-w-md mx-auto">
      <GameHeader headerText={state.headerText} />
      
      <Coin state={state.state} result={state.result} />

      <div className="w-full space-y-6">
        {/* Side Selection */}
        <SideSelector
          selectedSide={selectedSide}
          onSideSelect={setSelectedSide}
          disabled={isPlacingBet}
        />

        {/* Bet Amount */}
        <BetAmountSelector
          betAmount={betAmount}
          onAmountSelect={setBetAmount}
          walletBalance={walletBalance}
          disabled={isPlacingBet}
          betAmounts={betAmounts}
        />

        {/* Place Bet Button */}
        <div className="text-center space-y-3">
          <PlaceBetButton
            selectedSide={selectedSide}
            isPlacingBet={isPlacingBet}
            walletBalance={walletBalance}
            betAmount={betAmount}
            coinState={state.state}
            onPlaceBet={placeBet}
          />
          <BetSummary
            betAmount={betAmount}
            selectedSide={selectedSide}
            isPlacingBet={isPlacingBet}
            coinState={state.state}
          />
         
        </div>

        {/* Warning */}
        <WarningBanner />
      </div>

      {/* Result Modal */}
      <ResultModal
        isOpen={showResultModal}
        onClose={closeResultModal}
        onNewBet={resetGame}
        betResult={lastBetResult}
      />

    </div>
  );
}