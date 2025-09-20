"use client";
import GameHeader from "../../layout/game-header";
import Coin from "../../coin/coin";
import { useWallet } from "@/hooks/useWallet";
import { useDegenGame } from "@/hooks/useDegenGame";
import SideSelector from "./side-selector";
import BetAmountSelector from "./bet-amount-selector";
import BetSummary from "./bet-summary";
import BetStatus from "./bet-status";
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
    isFlipping,
  } = useDegenGame();

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-8">
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
          <BetStatus
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

      {/* Flipping Modal */}
      {isFlipping && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-900 border-2 border-gray-600 rounded-xl p-8 max-w-md mx-4 text-center">
            <div className="text-6xl mb-6 animate-spin">🪙</div>
            <h2 className="pixel-font text-2xl font-bold text-white mb-4">
              🎲 FLIPPING COIN...
            </h2>
            <p className="text-gray-300 text-sm">
              The coin is spinning in the air...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}